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
 * - FCM device tokens (from Firebase getToken) → FCM HTTP v1 API
 * - Legacy GCM tokens (APA91b...) → FCM Legacy HTTP API when server key is set
 * - Standard push endpoints (Firefox, desktop Chrome VAPID) → Web Push / VAPID
 */
class WebPushService
{
    private ?WebPush $webPush = null;

    public function __construct(private FcmAccessTokenService $tokenService) {}

    public function sendToUser(int $userId, array $payload): void
    {
        $subscriptions = PushSubscription::where('user_id', $userId)->get();

        if ($subscriptions->isEmpty()) {
            Log::info("WebPush: No subscriptions found for user_id={$userId}. Adviser may not have enabled notifications on this device.");
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
            $tokenType = strtolower((string) ($subscription->token_type ?? ''));

            if ($tokenType === 'fcm' || $this->isFcmDeviceToken($subscription)) {
                if ($this->isLegacyFcmToken($endpoint)) {
                    $this->sendViaLegacyFcm($subscription, $payload);
                } else {
                    $this->sendViaFcmV1($subscription, $payload);
                }
                return;
            }

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

    private function isFcmDeviceToken(PushSubscription $subscription): bool
    {
        if (!empty($subscription->p256dh_key) || !empty($subscription->auth_key)) {
            return false;
        }

        $endpoint = $subscription->endpoint;

        return !str_starts_with($endpoint, 'https://')
            && strlen($endpoint) >= 100;
    }

    private function sendViaLegacyFcm(PushSubscription $subscription, array $payload): void
    {
        $serverKey = config('webpush.fcm_server_key');
        if (empty($serverKey)) {
            $this->sendViaFcmV1($subscription, $payload);
            return;
        }

        $data = FcmMessageBuilder::buildDataPayload($payload);

        $body = [
            'to' => $subscription->endpoint,
            'notification' => [
                'title'        => $data['title'],
                'body'         => $data['body'],
                'icon'         => $data['icon'],
                'badge'        => $data['badge'],
                'tag'          => $data['tag'],
                'click_action' => $data['url'],
            ],
            'data' => $data,
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

    private function sendViaFcmV1(PushSubscription $subscription, array $payload): void
    {
        $projectId = config('webpush.fcm_project_id');
        if (empty($projectId)) {
            $json        = config('webpush.fcm_service_account_json');
            $credentials = $json ? json_decode($json, true) : null;
            $projectId   = $credentials['project_id'] ?? '';
        }

        if (empty($projectId)) {
            Log::error('WebPush: FCM project_id / FCM_SERVICE_ACCOUNT_JSON not configured. Push cannot be sent.');
            return;
        }

        $endpoint = $subscription->endpoint;
        $token    = str_contains($endpoint, 'fcm.googleapis.com/fcm/send/')
            ? last(explode('/', rtrim($endpoint, '/')))
            : $endpoint;

        if (empty($token)) {
            Log::warning("WebPush: Could not extract FCM token from endpoint: {$endpoint}");
            return;
        }

        $accessToken = $this->tokenService->getAccessToken();
        if (!$accessToken) {
            Log::error('WebPush: Failed to obtain FCM access token. Check FCM_SERVICE_ACCOUNT_JSON in .env.');
            return;
        }

        $message = FcmMessageBuilder::buildForToken($token, $payload);

        $response = Http::withToken($accessToken)
            ->post("https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send", $message);

        if ($response->successful()) {
            Log::info("WebPush: FCM v1 push sent to user {$subscription->user_id}");
        } elseif (in_array($response->status(), [404, 410])) {
            $subscription->delete();
            Log::info("WebPush: Removed expired FCM subscription for user {$subscription->user_id}");
        } else {
            Log::warning("WebPush: FCM v1 push failed for user {$subscription->user_id}: " . $response->body());
        }
    }

    private function sendViaWebPush(PushSubscription $subscription, array $payload): void
    {
        if (empty($subscription->p256dh_key) || empty($subscription->auth_key)) {
            Log::warning("WebPush: VAPID keys missing for user {$subscription->user_id}; cannot send.");
            return;
        }

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

        $this->webPush = new WebPush([
            'VAPID' => [
                'subject'    => config('webpush.vapid_subject', 'mailto:admin@studentcare.site'),
                'publicKey'  => config('webpush.vapid_public_key'),
                'privateKey' => config('webpush.vapid_private_key'),
            ],
        ]);
        $this->webPush->setDefaultOptions(['TTL' => 86400]);

        return $this->webPush;
    }

    private function isLegacyFcmToken(string $endpoint): bool
    {
        return str_starts_with($endpoint, 'APA91b')
            || str_starts_with($endpoint, 'f3gskX')
            || str_contains($endpoint, ':APA91b');
    }

    private function isFcmEndpoint(string $endpoint): bool
    {
        return str_contains($endpoint, 'fcm.googleapis.com');
    }
}
