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
     * @param  string  $role
     * @return mixed
     */
    public function handle(Request $request, Closure $next, string $role)
    {
        if (!Auth::check()) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $user = Auth::user();
        
        if (!$user->role) {
            return response()->json(['error' => 'User has no role assigned'], 403);
        }

        $userRole = strtolower($user->role->role_name);
        $requiredRole = strtolower($role);

        // Map role names for consistency
        $roleMapping = [
            'admin' => 'admin',
            'adviser' => 'adviser', 
            'clinic_staff' => 'clinic staff',
            'student' => 'student'
        ];

        $mappedUserRole = $roleMapping[$userRole] ?? $userRole;
        $mappedRequiredRole = $roleMapping[$requiredRole] ?? $requiredRole;

        if ($mappedUserRole !== $mappedRequiredRole) {
            return response()->json([
                'error' => 'Insufficient permissions',
                'required_role' => $requiredRole,
                'user_role' => $userRole
            ], 403);
        }

        return $next($request);
    }
}