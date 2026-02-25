<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\DatabaseTestController;
use App\Http\Controllers\Api\AuthController;

// Health check endpoint
Route::get('/health', function () {
    return response()->json([
        'success' => true,
        'message' => 'Medical Record System API is running',
        'version' => '1.0.0',
        'timestamp' => now()->toISOString()
    ]);
});

// Authentication endpoints (public)
Route::post('/login', [AuthController::class, 'login']);

// Simple test login endpoint
Route::post('/test/simple-login', function (Request $request) {
    try {
        $username = $request->input('username');
        $password = $request->input('password');
        
        if (!$username || !$password) {
            return response()->json([
                'success' => false,
                'message' => 'Username and password are required'
            ], 400);
        }
        
        // Find user
        $user = \App\Models\User::where('username', $username)
                                ->where('is_active', true)
                                ->whereNull('deleted_at')
                                ->first();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }
        
        // Check password
        if (!password_verify($password, $user->password_hash)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid password'
            ], 401);
        }
        
        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'user' => [
                'user_id' => $user->user_id,
                'username' => $user->username,
                'full_name' => $user->full_name,
                'email' => $user->email
            ]
        ]);
        
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage()
        ], 500);
    }
});

// Database test endpoints (for development)
Route::get('/test/database', [DatabaseTestController::class, 'testConnection']);
Route::get('/test/relationships', [DatabaseTestController::class, 'testRelationships']);
Route::get('/test/users', function () {
    $users = \App\Models\User::with('role')->get(['user_id', 'username', 'email', 'full_name', 'role_id']);
    return response()->json([
        'success' => true,
        'data' => $users
    ]);
});

// Reset any user password endpoint (for development only)
Route::post('/test/reset-password', function (Request $request) {
    try {
        $username = $request->input('username');
        $newPassword = $request->input('password', 'password123');
        
        if (!$username) {
            return response()->json([
                'success' => false,
                'message' => 'Username is required'
            ], 400);
        }
        
        $user = \App\Models\User::where('username', $username)->first();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }

        // Update password
        $user->password_hash = password_hash($newPassword, PASSWORD_DEFAULT);
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Password reset successfully',
            'data' => [
                'username' => $username,
                'new_password' => $newPassword
            ]
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage()
        ], 500);
    }
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Authentication endpoints (protected)
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
    Route::get('/me', [AuthController::class, 'me']);
    
    // Legacy user endpoint
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    
    // Future API endpoints will be added here
    // Route::apiResource('students', StudentController::class);
    // Route::post('medical-visits', [MedicalVisitController::class, 'store']);
});
