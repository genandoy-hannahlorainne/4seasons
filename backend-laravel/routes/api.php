<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\AdviserController;
use App\Http\Controllers\StaffController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// CORS preflight handling
Route::options('{any}', function () {
    return response('', 200);
})->where('any', '.*');

// Authentication routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// Test routes
Route::get('/test', function () {
    return response()->json([
        'success' => true,
        'message' => 'Laravel API is working!',
        'timestamp' => now()
    ]);
});

Route::get('/test-db', function () {
    try {
        DB::connection()->getPdo();
        return response()->json([
            'success' => true,
            'message' => 'Database connection successful',
            'database' => config('database.connections.mysql.database')
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Database connection failed',
            'error' => $e->getMessage()
        ], 500);
    }
});

// Protected routes (require authentication)
Route::middleware('auth:sanctum')->group(function () {
    // Student routes
    Route::get('/student/profile', [StudentController::class, 'getProfile']);
    Route::put('/student/profile', [StudentController::class, 'updateProfile']);
    Route::get('/student/medical-data', [StudentController::class, 'getMedicalData']);
    Route::get('/student/qr', [StudentController::class, 'getQR']);
    
    // Adviser routes
    Route::get('/adviser/dashboard', [AdviserController::class, 'getDashboard']);
    
    // Staff routes
    Route::get('/staff/dashboard', [StaffController::class, 'getDashboard']);
    
    // Password change
    Route::post('/change-password', [AuthController::class, 'changePassword']);
});

// QR Code generation (public for now)
Route::get('/generate-qr-image/{token}', [StudentController::class, 'generateQRImage']);