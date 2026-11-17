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
        // Behind a reverse proxy (Caddy on AWS, or a load balancer), trust the
        // X-Forwarded-* headers so HTTPS detection, client IPs and secure cookies work.
        $middleware->trustProxies(at: env('TRUSTED_PROXIES', '*'));

        // Inertia: handle session flash on redirects
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
        ]);

        // Public Web-to-Lead forms (/f/{token}) are anonymous and embeddable in
        // third-party sites via <iframe>, where session cookies (and therefore
        // CSRF tokens) are unavailable. They are protected by throttle + honeypot.
        $middleware->validateCsrfTokens(except: ['f/*']);

        // Custom role middleware aliases
        $middleware->alias([
            'ensure.admin'   => \App\Http\Middleware\EnsureAdmin::class,
            'ensure.manager' => \App\Http\Middleware\EnsureManager::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Return JSON for all API routes instead of HTML redirects
        $exceptions->renderable(function (\Illuminate\Auth\AuthenticationException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }
        });

        $exceptions->renderable(function (\Illuminate\Database\Eloquent\ModelNotFoundException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'Resource not found.'], 404);
            }
        });

        $exceptions->renderable(function (\Illuminate\Validation\ValidationException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
            }
        });

        $exceptions->renderable(function (\Illuminate\Auth\Access\AuthorizationException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'Forbidden.'], 403);
            }
        });
    })->create();
