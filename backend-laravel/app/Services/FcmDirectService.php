<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\PushSubscription;

class FcmDirectService
{
    public function __construct(private FcmAccessTokenService $tokenService) {}

    /**
     * Send a notification to a specific user by their user ID.
     * Requires the user to have registered device tokens.
     */
    public function sendToUser(int $userId, array $payload): bool
    {
        $deviceTokens = $this->getFcmTokensForUser($userId);
        
        if (empty($deviceTokens)) {
            Log::info("FcmDirect: No device tokens found for user_id={$userId}");
            return false;
        }

        $success = true;
        foreach ($deviceTokens as $token) {
            if (!$this->sendToToken($token, $payload)) {
                $success = false;
            }
        }

        return $success;
    }

    /**
     * Send a notification to a specific device token.
     */
    public function sendToToken(string $deviceToken, array $payload): bool
    {
        $projectId = config('webpush.fcm_project_id');
        if (empty($projectId)) {
            Log::error('FcmDirect: FCM project_id not configured');
            return false;
        }

        $accessToken = $this->getAccessToken();
        if (!$accessToken) {
            Log::error('FcmDirect: Failed to obtain access token');
            return false;
        }

        $message = [
            'message' => [
                'token'        => $deviceToken,
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
            ->post("https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send", $message);

        if ($response->successful()) {
            Log::info("FcmDirect: Message sent successfully to token: " . substr($deviceToken, 0, 20) . '...');
            return true;
        }

        if (in_array($response->status(), [404, 410])) {
            PushSubscription::where('endpoint', $deviceToken)->delete();
            Log::info("FcmDirect: Removed expired token: " . substr($deviceToken, 0, 20) . '...');
            return false;
        }

        Log::warning("FcmDirect: Failed to send message: " . $response->body());
        return false;
    }

    /**
     * Send a notification to a topic.
     * Users can subscribe to topics on the client side.
     */
    public function sendToTopic(string $topic, array $payload): bool
    {
        $projectId = config('webpush.fcm_project_id');
        if (empty($projectId)) {
            Log::error('FcmDirect: FCM project_id not configured');
            return false;
        }

        $accessToken = $this->getAccessToken();
        if (!$accessToken) {
            Log::error('FcmDirect: Failed to obtain access token');
            return false;
        }

        $message = [
            'message' => [
                'topic'        => $topic,
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
            ->post("https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send", $message);

        if ($response->successful()) {
            Log::info("FcmDirect: Message sent to topic: {$topic}");
            return true;
        }

        Log::warning("FcmDirect: Failed to send to topic {$topic}: " . $response->body());
        return false;
    }

    /**
     * Send a notification to multiple conditions.
     * Example: "'topic1' in topics && 'topic2' in topics"
     */
    public function sendToCondition(string $condition, array $payload): bool
    {
        $projectId = config('webpush.fcm_project_id');
        if (empty($projectId)) {
            Log::error('FcmDirect: FCM project_id not configured');
            return false;
        }

        $accessToken = $this->getAccessToken();
        if (!$accessToken) {
            Log::error('FcmDirect: Failed to obtain access token');
            return false;
        }

        $message = [
            'message' => [
                'condition'    => $condition,
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
            ->post("https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send", $message);

        if ($response->successful()) {
            Log::info("FcmDirect: Message sent to condition: {$condition}");
            return true;
        }

        Log::warning("FcmDirect: Failed to send to condition: " . $response->body());
        return false;
    }

    // ─── Private Helpers ──────────────────────────────────────────────────────

    private function getAccessToken(): ?string
    {
        return $this->tokenService->getAccessToken();
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

    /**
     * Build the Android-specific FCM block.
     * Required for push notifications to work on Android devices.
     */
    private function buildAndroidBlock(array $payload): array
    {
        $appUrl   = rtrim(config('app.url', 'https://studentcare.site'), '/');
        $rawIcon  = $payload['icon']  ?? '/assets/icons/school-clinic.png';
        $rawLink  = $payload['data']['url'] ?? '/adviser/notifications';

        $icon  = str_starts_with($rawIcon, 'http') ? $rawIcon : $appUrl . $rawIcon;
        $link  = str_starts_with($rawLink, 'http') ? $rawLink : $appUrl . $rawLink;

        $isEmergency = $payload['requireInteraction'] ?? false;

        return [
            'notification' => [
                'icon'          => $icon,
                'tag'           => $payload['tag'] ?? 'studentcare-notification',
                'click_action'  => $link,
                'channel_id'    => $isEmergency ? 'studentcare_urgent' : 'studentcare_default',
            ],
            'fcm_options' => [
                'analytics_label' => 'studentcare_push',
            ],
            'data' => array_merge(
                $payload['data'] ?? [],
                ['url' => $link]
            ),
        ];
    }

    /**
     * Build the APNs (Apple Push Notification service) block.
     * Required for push notifications to work on iOS devices (Safari PWA / iOS Chrome).
     */
    private function buildApnsBlock(array $payload): array
    {
        $appUrl   = rtrim(config('app.url', 'https://studentcare.site'), '/');
        $rawLink  = $payload['data']['url'] ?? '/adviser/notifications';
        $link     = str_starts_with($rawLink, 'http') ? $rawLink : $appUrl . $rawLink;

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
            'payload' => [
                'aps' => $aps,
                'url' => $link,
            ],
            'fcm_options' => [
                'analytics_label' => 'studentcare_push',
            ],
        ];
    }

    private function getFcmTokensForUser(int $userId): array
    {
        return PushSubscription::where('user_id', $userId)
            ->pluck('endpoint')
            ->toArray();
    }
}
