<?php

namespace App\Services;

use App\Models\PushSubscription;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

/**
 * Sends Web Push notifications using the minishlink/web-push package.
 * The laravel-notification-channels/webpush package bundles this library.
 */
class WebPushService
{
    private ?WebPush $webPush = null;

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

    /**
     * Send a push notification to all subscriptions of a user.
     */
    public function sendToUser(int $userId, array $payload): void
    {
        $subscriptions = PushSubscription::where('user_id', $userId)->get();

        if ($subscriptions->isEmpty()) {
            Log::info("WebPush: No subscriptions found for user_id={$userId}. User may not have granted permission yet.");
            return;
        }

        foreach ($subscriptions as $subscription) {
            $this->send($subscription, $payload);
        }
    }

    /**
     * Send a push notification to a single subscription.
     */
    public function send(PushSubscription $subscription, array $payload): void
    {
        if (empty(config('webpush.vapid_public_key')) || empty(config('webpush.vapid_private_key'))) {
            Log::warning('WebPush: VAPID keys not configured. Skipping push notification.');
            return;
        }

        try {
            $webPush = $this->getWebPush();

            $sub = Subscription::create([
                'endpoint'        => $subscription->endpoint,
                'contentEncoding' => 'aesgcm',
                'keys'            => [
                    'p256dh' => $subscription->p256dh_key,
                    'auth'   => $subscription->auth_key,
                ],
            ]);

            $webPush->queueNotification($sub, json_encode($payload));

            foreach ($webPush->flush() as $report) {
                if ($report->isSuccess()) {
                    Log::info("WebPush: Push sent successfully to user {$subscription->user_id}");
                } elseif ($report->isSubscriptionExpired()) {
                    $subscription->delete();
                    Log::info("WebPush: Removed expired subscription for user {$subscription->user_id}");
                } else {
                    Log::warning("WebPush: Push failed for user {$subscription->user_id}: " . $report->getReason());
                }
            }
        } catch (\Throwable $e) {
            Log::error("WebPush: Exception for user {$subscription->user_id}: " . $e->getMessage());
        }
    }
}
