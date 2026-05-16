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
 * - Legacy GCM tokens (APA91b...) → FCM Legacy HTTP API (server key)
 * - New FCM tokens / fcm.googleapis.com URLs → FCM HTTP v1 API (service account)
 * - All other endpoints (Firefox, desktop Chrome VAPID) → Standard Web Push / VAPID
 */
class WebPushService
{
    private ?WebPush $webPush = null;

    // ─── Public API ───────────────────────────────────────────────────────────

    public function sendToUser(int $userId, array $payload): void
    {
        $subscriptions = PushSubscription::where('user_id', $userId)->get();

        if ($subscriptions->isEmpty()) {
            Log::info("WebPush: No subscriptions found for user_id={$userId}.");
            return;
        }

        foreach ($subscriptions as $subscription) {
            $this->send($subscription, $payload);
        }
    }

    public function send(PushSubscription $subscription, array $payload): void
    {
        try {
            $endpoint = $subscription->endpoint;

            if ($this->isLegacyFcmToken($endpoint)) {
                $this->sendViaLegacyFcm($subscription, $payload);
            } elseif ($this->isFcmEndpoint($endpoint)) {
                $this->sendViaFcmV1($subscription, $payload);
            } else {
                $this->sendViaWebPush($subscription, $payload);
            }
        } catch (\Throwable $e) {
            Log::error("WebPush: Exception for user {$subscription->user_id}: " . $e->getMessage());
        }
    }

    // ─── Legacy FCM (for APA91b... tokens) ───────────────────────────────────

    /**
     * Send via FCM Legacy HTTP API using server key.
     * Required for old-format GCM/FCM tokens (APA91b...).
     */
    private function sendViaLegacyFcm(PushSubscription $subscription, array $payload): void
    {
        $serverKey = config('webpush.fcm_server_key');
        if (empty($serverKey)) {
            // Fall back to v1 if no server key configured
            $this->sendViaFcmV1($subscription, $payload);
            return;
        }

        $token = $subscription->endpoint;

        $appUrl  = rtrim(config('app.url', 'https://studentcare.site'), '/');
        $rawLink = $payload['data']['url'] ?? '/adviser/notifications';
        $link    = str_starts_with($rawLink, 'http') ? $rawLink : $appUrl . $rawLink;

        $body = [
            'to' => $token,
            'notification' => [
                'title'        => $payload['title'] ?? 'Studentcare',
                'body'         => $payload['body']  ?? '',
                'icon'         => $payload['icon']  ?? ($appUrl . '/assets/icons/school-clinic.png'),
                'badge'        => $payload['badge'] ?? ($appUrl . '/assets/icons/notification.png'),
                'tag'          => $payload['tag']   ?? 'studentcare-notification',
                'click_action' => $link,
            ],
            'data' => array_merge($payload['data'] ?? [], ['url' => $link]),
        ];

        $response = Http::withHeaders([
            'Authorization' => 'key=' . $serverKey,
            'Content-Type'  => 'application/json',
        ])->post('https://fcm.googleapis.com/fcm/send', $body);

        if ($response->successful()) {
            $result = $response->json();
            if (($result['failure'] ?? 0) > 0) {
                $error = $result['results'][0]['error'] ?? 'unknown';
                if (in_array($error, ['NotRegistered', 'InvalidRegistration'])) {
                    $subscription->delete();
                    Log::info("WebPush: Removed expired legacy FCM subscription for user {$subscription->user_id}");
                } else {
                    Log::warning("WebPush: Legacy FCM failed for user {$subscription->user_id}: {$error}");
                }
            } else {
                Log::info("WebPush: Legacy FCM push sent to user {$subscription->user_id}");
            }
        } else {
            Log::warning("WebPush: Legacy FCM HTTP error for user {$subscription->user_id}: " . $response->body());
        }
    }

    // ─── FCM v1 ───────────────────────────────────────────────────────────────

    private function sendViaFcmV1(PushSubscription $subscription, array $payload): void
    {
        $projectId = config('webpush.fcm_project_id');
        if (empty($projectId)) {
            $json = config('webpush.fcm_service_account_json');
            $credentials = $json ? json_decode($json, true) : null;
            $projectId = $credentials['project_id'] ?? '';
        }

        if (empty($projectId)) {
            Log::warning('WebPush: FCM project_id not configured. Skipping FCM push.');
            return;
        }

        $endpoint = $subscription->endpoint;
        $token = str_contains($endpoint, 'fcm.googleapis.com/fcm/send/')
            ? last(explode('/', rtrim($endpoint, '/')))
            : $endpoint;

        if (empty($token)) {
            Log::warning("WebPush: Could not extract FCM token from endpoint: {$endpoint}");
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
                'webpush' => $this->buildWebpushBlock($payload),
                'android' => $this->buildAndroidBlock($payload),
                'apns'    => $this->buildApnsBlock($payload),
            ],
        ];

        $response = Http::withToken($accessToken)
            ->post("https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send", $notification);

        if ($response->successful()) {
            Log::info("WebPush: FCM v1 push sent to user {$subscription->user_id}");
        } elseif (in_array($response->status(), [404, 410])) {
            $subscription->delete();
            Log::info("WebPush: Removed expired FCM subscription for user {$subscription->user_id}");
        } else {
            Log::warning("WebPush: FCM v1 push failed for user {$subscription->user_id}: " . $response->body());
        }
    }

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
            $now = time();
            $header  = $this->base64UrlEncode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
            $claims  = $this->base64UrlEncode(json_encode([
                'iss'   => $clientEmail,
                'scope' => 'https://www.googleapis.com/auth/cloud-platform',
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

    private function buildWebpushBlock(array $payload): array
    {
        $appUrl  = rtrim(config('app.url', 'https://studentcare.site'), '/');

        $rawIcon  = $payload['icon']  ?? '/assets/icons/school-clinic.png';
        $rawBadge = $payload['badge'] ?? '/assets/icons/notification.png';
        $rawLink  = $payload['data']['url'] ?? '/adviser/notifications';

        $icon  = str_starts_with($rawIcon,  'http') ? $rawIcon  : $appUrl . $rawIcon;
        $badge = str_starts_with($rawBadge, 'http') ? $rawBadge : $appUrl . $rawBadge;
        $link  = str_starts_with($rawLink,  'http') ? $rawLink  : $appUrl . $rawLink;

        return [
            'notification' => [
                'title'              => $payload['title']   ?? 'Studentcare',
                'body'               => $payload['body']    ?? '',
                'icon'               => $icon,
                'badge'              => $badge,
                'tag'                => $payload['tag']     ?? 'studentcare-notification',
                'requireInteraction' => $payload['requireInteraction'] ?? false,
                'vibrate'            => ($payload['requireInteraction'] ?? false) ? [200, 100, 200, 100, 200] : [200],
                'actions'            => $payload['actions'] ?? [],
                'data'               => array_merge($payload['data'] ?? [], ['url' => $link]),
            ],
            'fcm_options' => ['link' => $link],
        ];
    }

    private function buildAndroidBlock(array $payload): array
    {
        $appUrl      = rtrim(config('app.url', 'https://studentcare.site'), '/');
        $rawIcon     = $payload['icon']  ?? '/assets/icons/school-clinic.png';
        $rawLink     = $payload['data']['url'] ?? '/adviser/notifications';
        $icon        = str_starts_with($rawIcon, 'http') ? $rawIcon : $appUrl . $rawIcon;
        $link        = str_starts_with($rawLink, 'http') ? $rawLink : $appUrl . $rawLink;
        $isEmergency = $payload['requireInteraction'] ?? false;

        return [
            'notification' => [
                'icon'         => $icon,
                'tag'          => $payload['tag'] ?? 'studentcare-notification',
                'click_action' => $link,
                'channel_id'   => $isEmergency ? 'studentcare_urgent' : 'studentcare_default',
            ],
            'fcm_options' => ['analytics_label' => 'studentcare_push'],
            'data'        => array_merge($payload['data'] ?? [], ['url' => $link]),
        ];
    }

    private function buildApnsBlock(array $payload): array
    {
        $appUrl      = rtrim(config('app.url', 'https://studentcare.site'), '/');
        $rawLink     = $payload['data']['url'] ?? '/adviser/notifications';
        $link        = str_starts_with($rawLink, 'http') ? $rawLink : $appUrl . $rawLink;
        $isEmergency = $payload['requireInteraction'] ?? false;

        $aps = [
            'alert' => [
                'title' => $payload['title'] ?? 'Studentcare',
                'body'  => $payload['body']  ?? '',
            ],
            'badge'             => 1,
            'content-available' => 1,
            'mutable-content'   => 1,
        ];

        if ($isEmergency) {
            $aps['sound'] = 'default';
        }

        return [
            'payload'     => ['aps' => $aps, 'url' => $link],
            'fcm_options' => ['analytics_label' => 'studentcare_push'],
        ];
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

    /**
     * Legacy GCM/FCM tokens start with APA91b and are ~152+ chars.
     * These require the legacy FCM HTTP API, not v1.
     */
    private function isLegacyFcmToken(string $endpoint): bool
    {
        return str_starts_with($endpoint, 'APA91b') || str_starts_with($endpoint, 'f3gskX');
    }

    private function isFcmEndpoint(string $endpoint): bool
    {
        return str_contains($endpoint, 'fcm.googleapis.com')
            || (!str_starts_with($endpoint, 'https://') && strlen($endpoint) > 100);
    }
}

