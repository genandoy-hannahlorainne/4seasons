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

    public function __construct(private FcmAccessTokenService $tokenService) {}

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

    private function sendViaLegacyFcm(PushSubscription $subscription, array $payload): void
    {
        $serverKey = config('webpush.fcm_server_key');
        if (empty($serverKey)) {
            $this->sendViaFcmV1($subscription, $payload);
            return;
        }

        $appUrl  = rtrim(config('app.url', 'https://studentcare.site'), '/');
        $rawLink = $payload['data']['url'] ?? '/adviser/notifications';
        $link    = str_starts_with($rawLink, 'http') ? $rawLink : $appUrl . $rawLink;

        $body = [
            'to' => $subscription->endpoint,
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
            $json        = config('webpush.fcm_service_account_json');
            $credentials = $json ? json_decode($json, true) : null;
            $projectId   = $credentials['project_id'] ?? '';
        }

        if (empty($projectId)) {
            Log::warning('WebPush: FCM project_id not configured. Skipping FCM push.');
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
            Log::error('WebPush: Failed to obtain FCM access token.');
            return;
        }

        $notification = [
            'message' => [
                'token'        => $token,
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

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function isLegacyFcmToken(string $endpoint): bool
    {
        return str_starts_with($endpoint, 'APA91b')
            || str_starts_with($endpoint, 'f3gskX')
            || str_contains($endpoint, ':APA91b');
    }

    private function isFcmEndpoint(string $endpoint): bool
    {
        if (str_contains($endpoint, 'fcm.googleapis.com')) {
            return true;
        }

        if (!str_starts_with($endpoint, 'https://') && strlen($endpoint) > 50) {
            return true;
        }

        return false;
    }

    private function buildWebpushBlock(array $payload): array
    {
        $appUrl   = rtrim(config('app.url', 'https://studentcare.site'), '/');
        $rawIcon  = $payload['icon']  ?? '/assets/icons/school-clinic.png';
        $rawBadge = $payload['badge'] ?? '/assets/icons/notification.png';
        $rawLink  = $payload['data']['url'] ?? '/adviser/notifications';
        $icon     = str_starts_with($rawIcon,  'http') ? $rawIcon  : $appUrl . $rawIcon;
        $badge    = str_starts_with($rawBadge, 'http') ? $rawBadge : $appUrl . $rawBadge;
        $link     = str_starts_with($rawLink,  'http') ? $rawLink  : $appUrl . $rawLink;

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
            'priority'    => 'high',
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
}
