<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/openapi.yaml', function () {
    $specPath = base_path('../documents/openapi.yaml');

    abort_unless(file_exists($specPath), 404);

    return response(file_get_contents($specPath), 200, [
        'Content-Type' => 'application/yaml; charset=UTF-8',
        'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
    ]);
});

Route::get('/swagger', function () {
    return view('swagger');
});
