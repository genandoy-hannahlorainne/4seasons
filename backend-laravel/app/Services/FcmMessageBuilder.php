<?php

namespace App\Services;

/**
 * Builds FCM HTTP v1 message bodies for web/Android/iOS push.
 * All custom data values must be strings (FCM requirement).
 */
class FcmMessageBuilder
{
    public static function buildForToken(string $token, array $payload): array
    {
        return [
            'message' => array_merge(
                ['token' => $token],
                self::sharedMessageFields($payload)
            ),
        ];
    }

    public static function buildForTopic(string $topic, array $payload): array
    {
        return [
            'message' => array_merge(
                ['topic' => $topic],
                self::sharedMessageFields($payload)
            ),
        ];
    }

    public static function buildForCondition(string $condition, array $payload): array
    {
        return [
            'message' => array_merge(
                ['condition' => $condition],
                self::sharedMessageFields($payload)
            ),
        ];
    }

    private static function sharedMessageFields(array $payload): array
    {
        return [
            'notification' => [
                'title' => (string) ($payload['title'] ?? 'Studentcare'),
                'body'  => (string) ($payload['body'] ?? ''),
            ],
            'data'    => self::buildDataPayload($payload),
            'webpush' => self::buildWebpushBlock($payload),
            'android' => self::buildAndroidBlock($payload),
            'apns'    => self::buildApnsBlock($payload),
        ];
    }

    /**
     * Flat string map delivered to the web service worker (onBackgroundMessage / onMessage).
     */
    public static function buildDataPayload(array $payload): array
    {
        $appUrl  = rtrim(config('app.url', 'https://studentcare.site'), '/');
        $rawIcon = $payload['icon'] ?? '/assets/icons/school-clinic.png';
        $rawBadge = $payload['badge'] ?? '/assets/icons/notification.png';
        $rawLink = $payload['data']['url'] ?? '/dashboard/adviser/alerts';

        $icon  = str_starts_with((string) $rawIcon, 'http') ? $rawIcon : $appUrl . $rawIcon;
        $badge = str_starts_with((string) $rawBadge, 'http') ? $rawBadge : $appUrl . $rawBadge;
        $link  = str_starts_with((string) $rawLink, 'http') ? $rawLink : $appUrl . $rawLink;

        $merged = array_merge($payload['data'] ?? [], [
            'title'              => (string) ($payload['title'] ?? 'Studentcare'),
            'body'               => (string) ($payload['body'] ?? ''),
            'icon'               => $icon,
            'badge'              => $badge,
            'tag'                => (string) ($payload['tag'] ?? 'studentcare-notification'),
            'url'                => $link,
            'requireInteraction' => ($payload['requireInteraction'] ?? false) ? 'true' : 'false',
        ]);

        if (!isset($merged['timestamp'])) {
            $merged['timestamp'] = (string) (now()->timestamp * 1000);
        }

        return self::stringifyMap($merged);
    }

    public static function stringifyMap(array $data): array
    {
        $out = [];
        foreach ($data as $key => $value) {
            if ($value === null || $value === '') {
                continue;
            }
            $out[(string) $key] = is_scalar($value) ? (string) $value : json_encode($value);
        }

        return $out;
    }

    private static function buildWebpushBlock(array $payload): array
    {
        $data = self::buildDataPayload($payload);

        return [
            'notification' => [
                'title'              => $data['title'],
                'body'               => $data['body'],
                'icon'               => $data['icon'],
                'badge'              => $data['badge'],
                'tag'                => $data['tag'],
                'requireInteraction' => $data['requireInteraction'] === 'true',
                'vibrate'            => $data['requireInteraction'] === 'true'
                    ? [200, 100, 200, 100, 200]
                    : [200],
                'actions'            => $payload['actions'] ?? [],
                'data'               => $data,
            ],
            'fcm_options' => ['link' => $data['url']],
        ];
    }

    private static function buildAndroidBlock(array $payload): array
    {
        $data = self::buildDataPayload($payload);
        $isEmergency = $data['requireInteraction'] === 'true';

        return [
            'priority'     => 'high',
            'notification' => [
                'icon'         => $data['icon'],
                'tag'          => $data['tag'],
                'click_action' => $data['url'],
                'channel_id'   => $isEmergency ? 'studentcare_urgent' : 'studentcare_default',
            ],
            'fcm_options' => ['analytics_label' => 'studentcare_push'],
            'data'        => $data,
        ];
    }

    private static function buildApnsBlock(array $payload): array
    {
        $data = self::buildDataPayload($payload);
        $isEmergency = $data['requireInteraction'] === 'true';

        $aps = [
            'alert' => [
                'title' => $data['title'],
                'body'  => $data['body'],
            ],
            'badge'             => 1,
            'content-available' => 1,
            'mutable-content'   => 1,
        ];

        if ($isEmergency) {
            $aps['sound'] = 'default';
        }

        return [
            'payload'     => ['aps' => $aps, 'url' => $data['url']],
            'fcm_options' => ['analytics_label' => 'studentcare_push'],
        ];
    }
}
