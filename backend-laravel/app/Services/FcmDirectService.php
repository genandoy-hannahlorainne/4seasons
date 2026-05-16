<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Direct Firebase Cloud Messaging Service
 * 
 * Sends notifications directly to Firebase using server-to-server authentication.
 * No client subscriptions required - uses Firebase Admin SDK credentials.
 * 
 * Supports:
 * - Sending to specific user IDs (requires device tokens stored in database)
 * - Sending to topics
 * - Sending to conditions
 */
class FcmDirectService
{
    private ?string $accessToken = null;
    private int $accessTokenExpiry = 0;

    /**
     * Send a notification to a specific user by their user ID.
     * Requires the user to have registered device tokens.
     */
    public function sendToUser(int $userId, array $payload): bool
    {
        $deviceTokens = $this->getDeviceTokensForUser($userId);
        
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

    /**
     * Get a valid access token, refreshing if necessary.
     */
    private function getAccessToken(): ?string
    {
        // Return cached token if still valid
        if ($this->accessToken && time() < $this->accessTokenExpiry - 60) {
            return $this->accessToken;
        }

        $serviceAccountJson = config('webpush.fcm_service_account_json');
        if (empty($serviceAccountJson)) {
            Log::error('FcmDirect: FCM_SERVICE_ACCOUNT_JSON not configured');
            return null;
        }

        $credentials = json_decode($serviceAccountJson, true);
        if (!$credentials) {
            Log::error('FcmDirect: Failed to parse FCM_SERVICE_ACCOUNT_JSON');
            return null;
        }

        $clientEmail = $credentials['client_email'] ?? '';
        $privateKey  = $credentials['private_key']  ?? '';

        if (empty($clientEmail) || empty($privateKey)) {
            Log::error('FcmDirect: Service account credentials incomplete');
            return null;
        }

        try {
            // Build JWT for OAuth2 token endpoint
            $now = time();
            $header  = $this->base64UrlEncode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
            $claims  = $this->base64UrlEncode(json_encode([
                'iss'   => $clientEmail,
                'sub'   => $clientEmail,
                'scope' => 'https://www.googleapis.com/auth/cloud-platform',
                'aud'   => 'https://oauth2.googleapis.com/token',
                'iat'   => $now,
                'exp'   => $now + 3600,
            ]));

            $signingInput = "{$header}.{$claims}";
            $privateKeyResource = openssl_pkey_get_private($privateKey);
            
            if (!$privateKeyResource) {
                Log::error('FcmDirect: Failed to load private key');
                return null;
            }

            openssl_sign($signingInput, $signature, $privateKeyResource, 'SHA256');
            $jwt = "{$signingInput}." . $this->base64UrlEncode($signature);

            $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion'  => $jwt,
            ]);

            if ($response->successful()) {
                $this->accessToken = $response->json('access_token');
                $this->accessTokenExpiry = time() + ($response->json('expires_in') ?? 3600);
                return $this->accessToken;
            }

            Log::error('FcmDirect: Token exchange failed: ' . $response->body());
            return null;
        } catch (\Throwable $e) {
            Log::error('FcmDirect: Access token exception: ' . $e->getMessage());
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

    private function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Get all device tokens for a user from the database.
     * Tokens are stored in the push_subscriptions table.
     */
    private function getDeviceTokensForUser(int $userId): array
    {
        return \App\Models\PushSubscription::where('user_id', $userId)
            ->pluck('endpoint')
            ->toArray();
    }
}
