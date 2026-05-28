<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->statefulApi();

        // Exclude auth endpoints from CSRF verification.
        // These routes are cross-origin SPA calls — no session exists yet at login,
        // and the XSRF-TOKEN cookie cannot be read cross-domain (e.g. localhost dev → production API).
        $middleware->validateCsrfTokens(except: [
            'api/login',
            'api/logout',
            'api/refresh',
            'api/register',
        ]);

        // For API routes, return JSON responses for unauthenticated requests
        $middleware->redirectGuestsTo(function ($request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                abort(401, 'Unauthenticated');
            }
            return '/login';
        });

        // Register role middleware
        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
            'audit' => \App\Http\Middleware\AuditMiddleware::class,
            'nocache' => \App\Http\Middleware\NoCacheMiddleware::class,
            'password.change.required' => \App\Http\Middleware\EnforcePasswordChangeMiddleware::class,
        ]);

        // Apply no-cache headers to all API responses
        $middleware->appendToGroup('api', [
            \App\Http\Middleware\NoCacheMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
