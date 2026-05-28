<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string ...$roles
     * @return mixed
     */
    public function handle(Request $request, Closure $next, string ...$roles)
    {
        if (!Auth::check()) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $user = Auth::user();
        
        if (!$user->role) {
            return response()->json(['error' => 'User has no role assigned'], 403);
        }

        if (empty($roles)) {
            return response()->json(['error' => 'Role middleware misconfigured: no role specified'], 500);
        }

        $userRole = strtolower(trim($user->role->role_name));

        // Map role names for consistency
        $roleMapping = [
            'admin' => 'admin',
            'adviser' => 'adviser',
            'clinic_staff' => 'clinic staff',
            'clinic staff' => 'clinic staff',
            'student' => 'student'
        ];

        $mappedUserRole = $roleMapping[$userRole] ?? $userRole;

        $allowedRoles = array_map(function ($role) use ($roleMapping) {
            $normalized = strtolower(trim($role));
            return $roleMapping[$normalized] ?? $normalized;
        }, $roles);

        if (!in_array($mappedUserRole, $allowedRoles, true)) {
            return response()->json([
                'error' => 'Insufficient permissions',
                'required_roles' => $allowedRoles,
                'user_role' => $mappedUserRole
            ], 403);
        }

        return $next($request);
    }
}