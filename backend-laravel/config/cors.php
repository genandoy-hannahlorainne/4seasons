<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => ['*'], // Allow all origins for development

    'allowed_origins_patterns' => [
        '/^https?:\/\/localhost(:[0-9]+)?$/',
        '/^https?:\/\/127\\.0\\.0\\.1(:[0-9]+)?$/',
        '/^https?:\/\/frontend(:[0-9]+)?$/',  // Allow frontend container
        '/^https?:\/\/.*\.localhost(:[0-9]+)?$/', // Allow subdomains
        '/^https?:\/\/host\.docker\.internal(:[0-9]+)?$/', // Docker host
        '/^https?:\/\/.*\.docker\.internal(:[0-9]+)?$/', // Docker internal domains
        '/^https?:\/\/0\.0\.0\.0(:[0-9]+)?$/', // Docker bridge network
        '/^https?:\/\/172\\..*$/', // Docker default bridge network range
        '/^https?:\/\/192\\.168\\..*$/', // Docker custom networks
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => ['Authorization', 'Content-Type', 'X-Requested-With'],

    'max_age' => 86400, // Cache preflight for 24 hours

    'supports_credentials' => true, // Enable for authentication cookies
];
