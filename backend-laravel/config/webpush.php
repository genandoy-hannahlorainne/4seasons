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
    | Option A (recommended): Set FCM_SERVICE_ACCOUNT_JSON to the full contents
    | of the service account JSON file from Firebase Console → Project Settings
    | → Service Accounts → Generate new private key. Paste as a single minified
    | JSON line in .env.
    |
    | Option B (separate keys): Set FCM_PROJECT_ID, FCM_CLIENT_EMAIL, and
    | FCM_PRIVATE_KEY individually. The config will auto-build the JSON blob.
    |
    | FCM_PRIVATE_KEY must include the full PEM including header/footer lines,
    | with literal \n for newlines (Laravel will expand them automatically).
    */
    'fcm_project_id' => env('FCM_PROJECT_ID', ''),
    'fcm_server_key' => env('FCM_SERVER_KEY', ''),

    // Build the service account JSON from either the full blob or separate keys
    'fcm_service_account_json' => (function () {
        // Option A: full JSON blob takes priority
        $json = env('FCM_SERVICE_ACCOUNT_JSON', '');
        if (!empty($json)) {
            return $json;
        }

        // Option B: build from separate keys
        $projectId   = env('FCM_PROJECT_ID', '');
        $clientEmail = env('FCM_CLIENT_EMAIL', '');
        $privateKey  = env('FCM_PRIVATE_KEY', '');

        if (empty($clientEmail) || empty($privateKey)) {
            return '';
        }

        return json_encode([
            'type'                        => 'service_account',
            'project_id'                  => $projectId,
            'client_email'                => $clientEmail,
            'private_key'                 => str_replace('\\n', "\n", $privateKey),
            'token_uri'                   => 'https://oauth2.googleapis.com/token',
            'auth_uri'                    => 'https://accounts.google.com/o/oauth2/auth',
            'auth_provider_x509_cert_url' => 'https://www.googleapis.com/oauth2/v1/certs',
        ]);
    })(),
];
