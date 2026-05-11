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
    | Set FCM_SERVICE_ACCOUNT_JSON to the full contents of the service account
    | JSON file downloaded from Firebase Console → Project Settings → Service Accounts.
    | Paste it as a single line (minified JSON) in the .env file.
    */
    'fcm_project_id'          => env('FCM_PROJECT_ID', ''),
    'fcm_service_account_json' => env('FCM_SERVICE_ACCOUNT_JSON', ''),
];
