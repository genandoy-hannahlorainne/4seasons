<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Hashids Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for ID obfuscation using Hashids algorithm
    |
    */
    'hashids' => [
        'salt' => env('HASHIDS_SALT', env('APP_KEY')),
        'min_length' => env('HASHIDS_MIN_LENGTH', 6),
        'alphabet' => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
    ],

    /*
    |--------------------------------------------------------------------------
    | Rate Limiting Configuration
    |--------------------------------------------------------------------------
    |
    | Configure rate limits for different API endpoints
    |
    */
    'rate_limits' => [
        'api' => env('RATE_LIMIT_API', 60), // requests per minute
        'login' => env('RATE_LIMIT_LOGIN', 5), // login attempts per minute
        'sensitive' => env('RATE_LIMIT_SENSITIVE', 30), // sensitive endpoints per minute
    ],

    /*
    |--------------------------------------------------------------------------
    | Audit Logging Configuration
    |--------------------------------------------------------------------------
    |
    | Configure which actions should be audited
    |
    */
    'audit' => [
        'enabled' => env('AUDIT_ENABLED', true),
        'retention_days' => env('AUDIT_RETENTION_DAYS', 365), // Keep logs for 1 year

        // Resources that should always be audited
        'auditable_resources' => [
            'Student',
            'SHDF',
            'MedicalVisit',
            'MedicalHistory',
            'User',
        ],

        // Actions that should be audited
        'auditable_actions' => [
            'view',
            'create',
            'update',
            'delete',
            'export',
        ],
    ],
];
