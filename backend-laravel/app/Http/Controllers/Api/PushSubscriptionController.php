<?php

namespace App\Http\Controllers\Api;

use App\Models\PushSubscription;
use Illuminate\Http\Request;

class PushSubscriptionController extends BaseController
{
    /**
     * Save or update a push subscription for the authenticated user.
     *
     * POST /api/push/subscribe
     */
    public function subscribe(Request $request)
    {
        $request->validate([
            'endpoint'   => 'required|string|max:4096',
            'p256dh_key' => 'nullable|string|max:512',
            'auth_key'   => 'nullable|string|max:512',
            'user_agent' => 'nullable|string|max:512',
        ]);

        $user = $request->user();

        PushSubscription::updateOrCreate(
            [
                'user_id'  => $user->user_id,
                'endpoint' => $request->endpoint,
            ],
            [
                'p256dh_key' => $request->p256dh_key,
                'auth_key'   => $request->auth_key,
                'user_agent' => $request->user_agent ?? $request->header('User-Agent'),
            ]
        );

        return $this->sendResponse(null, 'Push subscription saved successfully');
    }

    /**
     * Remove a push subscription (e.g. when user disables notifications).
     *
     * DELETE /api/push/unsubscribe
     */
    public function unsubscribe(Request $request)
    {
        $request->validate([
            'endpoint' => 'required|string',
        ]);

        PushSubscription::where('user_id', $request->user()->user_id)
            ->where('endpoint', $request->endpoint)
            ->delete();

        return $this->sendResponse(null, 'Push subscription removed successfully');
    }

    /**
     * Return the VAPID public key so the frontend can subscribe.
     *
     * GET /api/push/vapid-public-key
     */
    public function vapidPublicKey()
    {
        return $this->sendResponse([
            'public_key' => config('webpush.vapid_public_key'),
        ], 'VAPID public key retrieved');
    }
}
