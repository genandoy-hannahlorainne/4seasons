<?php

return [
    /*
    |--------------------------------------------------------------------------
    | VAPID Keys for Web Push
    |--------------------------------------------------------------------------
    |
    | Generate a key pair with:
    |   php artisan webpush:vapid
    |
    | Or use an online generator: https://vapidkeys.com
    |
    | VAPID_PUBLIC_KEY  — base64url-encoded uncompressed P-256 public key (87 chars)
    | VAPID_PRIVATE_KEY — base64url-encoded raw P-256 private key (43 chars)
    | VAPID_SUBJECT     — mailto: or https: URI identifying the push sender
    */
    'vapid_public_key'  => env('VAPID_PUBLIC_KEY', ''),
    'vapid_private_key' => env('VAPID_PRIVATE_KEY', ''),
    'vapid_subject'     => env('VAPID_SUBJECT', 'mailto:admin@studentcare.site'),
];
