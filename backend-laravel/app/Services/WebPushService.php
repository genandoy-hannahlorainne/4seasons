<?php

namespace App\Services;

use App\Models\PushSubscription;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

/**
 * Sends Web Push notifications.
 *
 * - Legacy FCM endpoints (fcm.googleapis.com/fcm/send/...) → FCM HTTP v1 API
 * - All other endpoints (Firefox, desktop Chrome, etc.)    → Standard Web Push / VAPID
 */
class WebPushService
{
    private ?WebPush $webPush = null;

    // ─── Public API ───────────────────────────────────────────────────────────

    /**
     * Send a push notification to all subscriptions of a user.
     */
    public function sendToUser(int $userId, array $payload): void
    {
        $subscriptions = PushSubscription::where('user_id', $userId)->get();

        if ($subscriptions->isEmpty()) {
            Log::info("WebPush: No subscriptions found for user_id={$userId}.");
            return;
        }

        foreach ($subscriptions as $subscription) {
            $this->send($subscription, $payload);
        }ubuntu@ip-172-26-2-172:~/4seasons$ docker exec 4seasons-backend-1 php -l /var/www/html/app/Services/WebPushService.php
No syntax errors detected in /var/www/html/app/Services/WebPushService.php
ubuntu@ip-172-26-2-172:~/4seasons$
    }

    /**
     * Send a push notification to a single subscription.
     * Routes to FCM v1 or standard Web Push based on the endpoint.
     */
    public function send(PushSubscription $subscription, array $payload): void
    {
        try {
            if ($this->isFcmEndpoint($subscription->endpoint)) {
                $this->sendViaFcmV1($subscription, $payload);
            } else {
                $this->sendViaWebPush($subscription, $payload);
            }
        } catch (\Throwable $e) {
            Log::error("WebPush: Exception for user {$subscription->user_id}: " . $e->getMessage());
        }
    }

    // ─── FCM v1 ───────────────────────────────────────────────────────────────

    /**
     * Send via Firebase Cloud Messaging HTTP v1 API.
     * Required for Chrome on Android which generates legacy fcm/send/ endpoints.
     */
    private function sendViaFcmV1(PushSubscription $subscription, array $payload): void
    {
        $projectId = config('webpush.fcm_project_id');
        if (empty($projectId)) {
            // Try to get it from the service account JSON
            $json = config('webpush.fcm_service_account_json');
            $credentials = $json ? json_decode($json, true) : null;
            $projectId = $credentials['project_id'] ?? '';
        }

        if (empty($projectId)) {
            Log::warning('WebPush: FCM project_id not configured. Skipping FCM push.');
            return;
        }

        // Extract the FCM registration token
        // New format: token stored directly as endpoint (token_type=fcm)
        // Legacy format: https://fcm.googleapis.com/fcm/send/{token}
        $endpoint = $subscription->endpoint;
        $token = str_contains($endpoint, 'fcm.googleapis.com/fcm/send/')
            ? last(explode('/', rtrim($endpoint, '/')))
            : $endpoint;
        if (empty($token)) {
            Log::warning("WebPush: Could not extract FCM token from endpoint: {$subscription->endpoint}");
            return;
        }

        $accessToken = $this->getFcmAccessToken();
        if (!$accessToken) {
            Log::error('WebPush: Failed to obtain FCM access token.');
            return;
        }

        $notification = [
            'message' => [
                'token' => $token,
                'notification' => [
                    'title' => $payload['title'] ?? 'Studentcare',
                    'body'  => $payload['body']  ?? '',
                ],
                'webpush' => [
                    'notification' => [
                        'title'              => $payload['title']   ?? 'Studentcare',
                        'body'               => $payload['body']    ?? '',
                        'icon'               => $payload['icon']    ?? '/assets/icons/school-clinic.png',
                        'badge'              => $payload['badge']   ?? '/assets/icons/notification.png',
                        'tag'                => $payload['tag']     ?? 'studentcare-notification',
                        'requireInteraction' => $payload['requireInteraction'] ?? false,
                        'vibrate'            => ($payload['requireInteraction'] ?? false) ? [200, 100, 200, 100, 200] : [200],
                        'actions'            => $payload['actions'] ?? [],
                        'data'               => $payload['data']    ?? [],
                    ],
                    'fcm_options' => [
                        'link' => $payload['data']['url'] ?? 'https://studentcare.site/adviser/notifications',
                    ],
                ],
            ],
        ];

        $response = Http::withToken($accessToken)
            ->post("https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send", $notification);

        if ($response->successful()) {
            Log::info("WebPush: FCM v1 push sent to user {$subscription->user_id}");
        } elseif (in_array($response->status(), [404, 410])) {
            // Token is no longer valid
            $subscription->delete();
            Log::info("WebPush: Removed expired FCM subscription for user {$subscription->user_id}");
        } else {
            Log::warning("WebPush: FCM v1 push failed for user {$subscription->user_id}: " . $response->body());
        }
    }

    /**
     * Get a short-lived OAuth2 access token for the FCM v1 API
     * using the Firebase service account credentials.
     */
    private function getFcmAccessToken(): ?string
    {
        $serviceAccountJson = config('webpush.fcm_service_account_json');
        if (empty($serviceAccountJson)) {
            Log::warning('WebPush: FCM_SERVICE_ACCOUNT_JSON not configured.');
            return null;
        }

        $credentials = json_decode($serviceAccountJson, true);
        if (!$credentials) {
            Log::error('WebPush: Failed to parse FCM_SERVICE_ACCOUNT_JSON.');
            return null;
        }

        $clientEmail = $credentials['client_email'] ?? '';
        $privateKey  = $credentials['private_key']  ?? '';

        if (empty($clientEmail) || empty($privateKey)) {
            Log::warning('WebPush: FCM service account credentials missing from JSON.');
            return null;
        }

        try {
            // Build a JWT for the Google OAuth2 token endpoint
            $now = time();
            $header  = $this->base64UrlEncode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
            $claims  = $this->base64UrlEncode(json_encode([
                'iss'   => $clientEmail,
                'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
                'aud'   => 'https://oauth2.googleapis.com/token',
                'iat'   => $now,
                'exp'   => $now + 3600,
            ]));

            $signingInput = "{$header}.{$claims}";
            $privateKeyResource = openssl_pkey_get_private($privateKey);
            if (!$privateKeyResource) {
                Log::error('WebPush: Failed to load FCM private key.');
                return null;
            }

            openssl_sign($signingInput, $signature, $privateKeyResource, 'SHA256');
            $jwt = "{$signingInput}." . $this->base64UrlEncode($signature);

            $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion'  => $jwt,
            ]);

            if ($response->successful()) {
                return $response->json('access_token');
            }

            Log::error('WebPush: FCM token exchange failed: ' . $response->body());
            return null;
        } catch (\Throwable $e) {
            Log::error('WebPush: FCM access token exception: ' . $e->getMessage());
            return null;
        }
    }

    private function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    // ─── Standard Web Push / VAPID ────────────────────────────────────────────

    private function sendViaWebPush(PushSubscription $subscription, array $payload): void
    {
        if (empty(config('webpush.vapid_public_key')) || empty(config('webpush.vapid_private_key'))) {
            Log::warning('WebPush: VAPID keys not configured. Skipping push notification.');
            return;
        }

        $webPush = $this->getWebPush();

        $sub = Subscription::create([
            'endpoint'        => $subscription->endpoint,
            'contentEncoding' => 'aes128gcm',
            'keys'            => [
                'p256dh' => $subscription->p256dh_key,
                'auth'   => $subscription->auth_key,
            ],
        ]);

        $webPush->queueNotification($sub, json_encode($payload));

        foreach ($webPush->flush() as $report) {
            if ($report->isSuccess()) {
                Log::info("WebPush: VAPID push sent to user {$subscription->user_id}");
            } elseif ($report->isSubscriptionExpired()) {
                $subscription->delete();
                Log::info("WebPush: Removed expired VAPID subscription for user {$subscription->user_id}");
            } else {
                Log::warning("WebPush: VAPID push failed for user {$subscription->user_id}: " . $report->getReason());
            }
        }
    }

    private function getWebPush(): WebPush
    {
        if ($this->webPush) {
            return $this->webPush;
        }

        $auth = [
            'VAPID' => [
                'subject'    => config('webpush.vapid_subject', 'mailto:admin@studentcare.site'),
                'publicKey'  => config('webpush.vapid_public_key'),
                'privateKey' => config('webpush.vapid_private_key'),
            ],
        ];

        $this->webPush = new WebPush($auth);
        $this->webPush->setDefaultOptions(['TTL' => 86400]);

        return $this->webPush;
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function isFcmEndpoint(string $endpoint): bool
    {
        // Legacy FCM URL: https://fcm.googleapis.com/fcm/send/{token}
        // New FCM token: stored directly (doesn't start with https://)
        // or contains fcm.googleapis.com
        return str_contains($endpoint, 'fcm.googleapis.com')
            || (!str_starts_with($endpoint, 'https://') && strlen($endpoint) > 100);
    }
}
