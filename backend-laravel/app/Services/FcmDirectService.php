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
                'token' => $deviceToken,
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
                'android' => [
                    'notification' => [
                        'title'              => $payload['title']   ?? 'Studentcare',
                        'body'               => $payload['body']    ?? '',
                        'icon'               => 'ic_notification',
                        'sound'              => 'default',
                        'channel_id'         => 'studentcare_notifications',
                        'priority'           => ($payload['requireInteraction'] ?? false) ? 'high' : 'default',
                    ],
                    'priority' => ($payload['requireInteraction'] ?? false) ? 'high' : 'normal',
                ],
                'apns' => [
                    'payload' => [
                        'aps' => [
                            'alert' => [
                                'title' => $payload['title'] ?? 'Studentcare',
                                'body'  => $payload['body']  ?? '',
                            ],
                            'sound' => 'default',
                            'badge' => 1,
                            'mutable-content' => true,
                        ],
                    ],
                ],
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
                'topic' => $topic,
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
                'condition' => $condition,
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
                'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
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
