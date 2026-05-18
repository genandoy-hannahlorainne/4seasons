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
    | Firebase Cloud Messaging (FCM) v1
    |--------------------------------------------------------------------------
    | Production (Docker): prefer FCM_SERVICE_ACCOUNT_PATH pointing to a mounted
    | JSON file — avoids broken .env parsing for large JSON blobs.
    |
    |   FCM_SERVICE_ACCOUNT_PATH=/run/secrets/firebase-service-account.json
    |
    | Alternative: FCM_SERVICE_ACCOUNT_JSON as a single line wrapped in SINGLE quotes:
    |   FCM_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
    |
    | Or separate keys: FCM_PROJECT_ID, FCM_CLIENT_EMAIL, FCM_PRIVATE_KEY
    */
    'fcm_project_id'             => env('FCM_PROJECT_ID', ''),
    'fcm_server_key'             => env('FCM_SERVER_KEY', ''),
    'fcm_service_account_path'   => env('FCM_SERVICE_ACCOUNT_PATH', ''),
    'fcm_service_account_json'   => env('FCM_SERVICE_ACCOUNT_JSON', ''),
    'fcm_client_email'           => env('FCM_CLIENT_EMAIL', ''),
    'fcm_private_key'            => env('FCM_PRIVATE_KEY', ''),
];
