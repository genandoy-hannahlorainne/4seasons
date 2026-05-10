<?php

return [
    /*
    |--------------------------------------------------------------------------
    | VAPID Keys for Web Push (non-FCM browsers: Firefox, desktop Chrome, etc.)
    |--------------------------------------------------------------------------
    | Generate with: php artisan webpush:vapid
    */
    'vapid_public_key'  => env('VAPID_PUBLIC_KEY', ''),
    'vapid_private_key' => env('VAPID_PRIVATE_KEY', ''),
    'vapid_subject'     => env('VAPID_SUBJECT', 'mailto:admin@studentcare.site'),

    /*
    |--------------------------------------------------------------------------
    | Firebase Cloud Messaging (FCM) v1 — for Chrome on Android
    |--------------------------------------------------------------------------
    | Chrome on Android generates legacy fcm.googleapis.com/fcm/send/ endpoints.
    | These require the FCM HTTP v1 API with a service account.
    |
    | Get credentials from Firebase Console → Project Settings → Service Accounts
    | → Generate new private key.
    |
    | FCM_PRIVATE_KEY: paste the full private key including -----BEGIN/END----- lines.
    | Replace literal \n in the JSON with actual newlines, or keep \n and PHP will handle it.
    */
    'fcm_project_id'   => env('FCM_PROJECT_ID', ''),
    'fcm_client_email' => env('FCM_CLIENT_EMAIL', ''),
    'fcm_private_key'  => env('FCM_PRIVATE_KEY', ''),
];
