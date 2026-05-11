<?php

namespace App\Http\Controllers\Api;

use App\Services\FcmDirectService;
use Illuminate\Http\Request;

/**
 * Direct FCM Messaging Controller
 * 
 * Endpoints for sending notifications directly via Firebase Cloud Messaging.
 * No client subscriptions required - uses server-to-server authentication.
 */
class FcmDirectController extends BaseController
{
    public function __construct(private FcmDirectService $fcmService) {}

    /**
     * Send a notification to a specific user.
     * 
     * POST /api/fcm/send-to-user
     * 
     * @bodyParam user_id int required The user ID to send to
     * @bodyParam title string required Notification title
     * @bodyParam body string required Notification body
     * @bodyParam icon string optional Icon URL
     * @bodyParam badge string optional Badge URL
     * @bodyParam tag string optional Notification tag
     * @bodyParam requireInteraction boolean optional Require user interaction
     * @bodyParam data object optional Custom data
     * @bodyParam actions array optional Notification actions
     */
    public function sendToUser(Request $request)
    {
        $request->validate([
            'user_id'            => 'required|integer|exists:users,user_id',
            'title'              => 'required|string|max:255',
            'body'               => 'required|string|max:1000',
            'icon'               => 'nullable|string|url',
            'badge'              => 'nullable|string|url',
            'tag'                => 'nullable|string|max:100',
            'requireInteraction' => 'nullable|boolean',
            'data'               => 'nullable|array',
            'actions'            => 'nullable|array',
        ]);

        $success = $this->fcmService->sendToUser(
            $request->integer('user_id'),
            [
                'title'              => $request->string('title'),
                'body'               => $request->string('body'),
                'icon'               => $request->string('icon'),
                'badge'              => $request->string('badge'),
                'tag'                => $request->string('tag'),
                'requireInteraction' => $request->boolean('requireInteraction'),
                'data'               => $request->array('data') ?? [],
                'actions'            => $request->array('actions') ?? [],
            ]
        );

        if ($success) {
            return $this->sendResponse(null, 'Notification sent successfully');
        }

        return $this->sendError('Failed to send notification', 500);
    }

    /**
     * Send a notification to a specific device token.
     * 
     * POST /api/fcm/send-to-token
     * 
     * @bodyParam token string required The FCM device token
     * @bodyParam title string required Notification title
     * @bodyParam body string required Notification body
     * @bodyParam icon string optional Icon URL
     * @bodyParam badge string optional Badge URL
     * @bodyParam tag string optional Notification tag
     * @bodyParam requireInteraction boolean optional Require user interaction
     * @bodyParam data object optional Custom data
     * @bodyParam actions array optional Notification actions
     */
    public function sendToToken(Request $request)
    {
        $request->validate([
            'token'              => 'required|string|min:100',
            'title'              => 'required|string|max:255',
            'body'               => 'required|string|max:1000',
            'icon'               => 'nullable|string|url',
            'badge'              => 'nullable|string|url',
            'tag'                => 'nullable|string|max:100',
            'requireInteraction' => 'nullable|boolean',
            'data'               => 'nullable|array',
            'actions'            => 'nullable|array',
        ]);

        $success = $this->fcmService->sendToToken(
            $request->string('token'),
            [
                'title'              => $request->string('title'),
                'body'               => $request->string('body'),
                'icon'               => $request->string('icon'),
                'badge'              => $request->string('badge'),
                'tag'                => $request->string('tag'),
                'requireInteraction' => $request->boolean('requireInteraction'),
                'data'               => $request->array('data') ?? [],
                'actions'            => $request->array('actions') ?? [],
            ]
        );

        if ($success) {
            return $this->sendResponse(null, 'Notification sent successfully');
        }

        return $this->sendError('Failed to send notification', 500);
    }

    /**
     * Send a notification to a topic.
     * 
     * POST /api/fcm/send-to-topic
     * 
     * @bodyParam topic string required The topic name
     * @bodyParam title string required Notification title
     * @bodyParam body string required Notification body
     * @bodyParam icon string optional Icon URL
     * @bodyParam badge string optional Badge URL
     * @bodyParam tag string optional Notification tag
     * @bodyParam requireInteraction boolean optional Require user interaction
     * @bodyParam data object optional Custom data
     * @bodyParam actions array optional Notification actions
     */
    public function sendToTopic(Request $request)
    {
        $request->validate([
            'topic'              => 'required|string|regex:/^[a-zA-Z0-9-_.~%]+$/',
            'title'              => 'required|string|max:255',
            'body'               => 'required|string|max:1000',
            'icon'               => 'nullable|string|url',
            'badge'              => 'nullable|string|url',
            'tag'                => 'nullable|string|max:100',
            'requireInteraction' => 'nullable|boolean',
            'data'               => 'nullable|array',
            'actions'            => 'nullable|array',
        ]);

        $success = $this->fcmService->sendToTopic(
            $request->string('topic'),
            [
                'title'              => $request->string('title'),
                'body'               => $request->string('body'),
                'icon'               => $request->string('icon'),
                'badge'              => $request->string('badge'),
                'tag'                => $request->string('tag'),
                'requireInteraction' => $request->boolean('requireInteraction'),
                'data'               => $request->array('data') ?? [],
                'actions'            => $request->array('actions') ?? [],
            ]
        );

        if ($success) {
            return $this->sendResponse(null, 'Notification sent to topic successfully');
        }

        return $this->sendError('Failed to send notification to topic', 500);
    }

    /**
     * Send a notification to a condition.
     * 
     * POST /api/fcm/send-to-condition
     * 
     * @bodyParam condition string required The condition (e.g., "'topic1' in topics && 'topic2' in topics")
     * @bodyParam title string required Notification title
     * @bodyParam body string required Notification body
     * @bodyParam icon string optional Icon URL
     * @bodyParam badge string optional Badge URL
     * @bodyParam tag string optional Notification tag
     * @bodyParam requireInteraction boolean optional Require user interaction
     * @bodyParam data object optional Custom data
     * @bodyParam actions array optional Notification actions
     */
    public function sendToCondition(Request $request)
    {
        $request->validate([
            'condition'          => 'required|string|max:500',
            'title'              => 'required|string|max:255',
            'body'               => 'required|string|max:1000',
            'icon'               => 'nullable|string|url',
            'badge'              => 'nullable|string|url',
            'tag'                => 'nullable|string|max:100',
            'requireInteraction' => 'nullable|boolean',
            'data'               => 'nullable|array',
            'actions'            => 'nullable|array',
        ]);

        $success = $this->fcmService->sendToCondition(
            $request->string('condition'),
            [
                'title'              => $request->string('title'),
                'body'               => $request->string('body'),
                'icon'               => $request->string('icon'),
                'badge'              => $request->string('badge'),
                'tag'                => $request->string('tag'),
                'requireInteraction' => $request->boolean('requireInteraction'),
                'data'               => $request->array('data') ?? [],
                'actions'            => $request->array('actions') ?? [],
            ]
        );

        if ($success) {
            return $this->sendResponse(null, 'Notification sent to condition successfully');
        }

        return $this->sendError('Failed to send notification to condition', 500);
    }
}
