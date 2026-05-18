<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\PushSubscription;

class FcmDirectService
{
    public function __construct(private FcmAccessTokenService $tokenService) {}

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

    public function sendToToken(string $deviceToken, array $payload): bool
    {
        $projectId = config('webpush.fcm_project_id');
        if (empty($projectId)) {
            $json        = config('webpush.fcm_service_account_json');
            $credentials = $json ? json_decode($json, true) : null;
            $projectId   = $credentials['project_id'] ?? '';
        }

        if (empty($projectId)) {
            Log::error('FcmDirect: FCM project_id not configured');
            return false;
        }

        $accessToken = $this->getAccessToken();
        if (!$accessToken) {
            Log::error('FcmDirect: Failed to obtain access token');
            return false;
        }

        $message = FcmMessageBuilder::buildForToken($deviceToken, $payload);

        $response = Http::withToken($accessToken)
            ->post("https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send", $message);

        if ($response->successful()) {
            Log::info('FcmDirect: Message sent successfully to token: ' . substr($deviceToken, 0, 20) . '...');
            return true;
        }

        if (in_array($response->status(), [404, 410])) {
            PushSubscription::where('endpoint', $deviceToken)->delete();
            Log::info('FcmDirect: Removed expired token: ' . substr($deviceToken, 0, 20) . '...');
            return false;
        }

        Log::warning('FcmDirect: Failed to send message: ' . $response->body());
        return false;
    }

    public function sendToTopic(string $topic, array $payload): bool
    {
        $projectId = $this->resolveProjectId();
        if (empty($projectId)) {
            return false;
        }

        $accessToken = $this->getAccessToken();
        if (!$accessToken) {
            return false;
        }

        $message = FcmMessageBuilder::buildForTopic($topic, $payload);

        $response = Http::withToken($accessToken)
            ->post("https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send", $message);

        if ($response->successful()) {
            Log::info("FcmDirect: Message sent to topic: {$topic}");
            return true;
        }

        Log::warning("FcmDirect: Failed to send to topic {$topic}: " . $response->body());
        return false;
    }

    public function sendToCondition(string $condition, array $payload): bool
    {
        $projectId = $this->resolveProjectId();
        if (empty($projectId)) {
            return false;
        }

        $accessToken = $this->getAccessToken();
        if (!$accessToken) {
            return false;
        }

        $message = FcmMessageBuilder::buildForCondition($condition, $payload);

        $response = Http::withToken($accessToken)
            ->post("https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send", $message);

        if ($response->successful()) {
            Log::info("FcmDirect: Message sent to condition: {$condition}");
            return true;
        }

        Log::warning('FcmDirect: Failed to send to condition: ' . $response->body());
        return false;
    }

    private function resolveProjectId(): string
    {
        $projectId = config('webpush.fcm_project_id');
        if (!empty($projectId)) {
            return $projectId;
        }

        $json = config('webpush.fcm_service_account_json');
        $credentials = $json ? json_decode($json, true) : null;

        return $credentials['project_id'] ?? '';
    }

    private function getAccessToken(): ?string
    {
        return $this->tokenService->getAccessToken();
    }

    private function getFcmTokensForUser(int $userId): array
    {
        return PushSubscription::where('user_id', $userId)
            ->where(function ($q) {
                $q->where('token_type', 'fcm')
                    ->orWhere(function ($inner) {
                        $inner->whereNull('p256dh_key')
                            ->whereNull('auth_key')
                            ->where('endpoint', 'not like', 'https://%');
                    });
            })
            ->pluck('endpoint')
            ->toArray();
    }
}
