<?php
// Simulate the exact HTTP login request
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';

$request = Illuminate\Http\Request::create(
    '/api/login',
    'POST',
    [],
    [],
    [],
    [
        'HTTP_ACCEPT' => 'application/json',
        'CONTENT_TYPE' => 'application/json',
        'HTTP_HOST' => 'localhost',
    ],
    json_encode(['username' => 'admin', 'password' => 'admin123'])
);

$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle($request);

echo "Status: " . $response->getStatusCode() . "\n";
echo "Body: " . $response->getContent() . "\n";
$kernel->terminate($request, $response);
