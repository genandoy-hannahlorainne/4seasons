<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnforcePasswordChangeMiddleware
{
    /**
     * Block access to protected API endpoints until forced password change is completed.
     */
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (!$user) {
            return $next($request);
        }

        if (!(bool) $user->password_must_change) {
            return $next($request);
        }

        // Allow only routes needed to complete or end the forced-change flow.
        if ($request->is('api/force-change-password')
            || $request->is('api/logout')
            || $request->is('api/me')
            || $request->is('api/refresh')) {
            return $next($request);
        }

        return response()->json([
            'success' => false,
            'message' => 'Password change required before accessing this resource.',
            'code' => 'PASSWORD_CHANGE_REQUIRED',
        ], 403);
    }
}
