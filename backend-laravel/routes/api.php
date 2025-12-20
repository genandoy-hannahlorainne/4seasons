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

// CORS preflight handling for all routes
Route::options('{any}', function (Request $request) {
    return response('', 200)
        ->header('Access-Control-Allow-Origin', 'http://localhost:4200')
        ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        ->header('Access-Control-Allow-Credentials', 'true');
})->where('any', '.*');

// Add CORS headers to all API responses
Route::middleware(['api'])->group(function () {
    // Authentication routes
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);

    // Test routes
    Route::get('/test', function () {
        return response()->json([
            'success' => true,
            'message' => 'Laravel API is working!',
            'timestamp' => now()
        ])->header('Access-Control-Allow-Origin', 'http://localhost:4200')
          ->header('Access-Control-Allow-Credentials', 'true');
    });

    Route::get('/test-db', function () {
        try {
            DB::connection()->getPdo();
            return response()->json([
                'success' => true,
                'message' => 'Database connection successful',
                'database' => config('database.connections.mysql.database')
            ])->header('Access-Control-Allow-Origin', 'http://localhost:4200')
              ->header('Access-Control-Allow-Credentials', 'true');
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Database connection failed',
                'error' => $e->getMessage()
            ], 500)->header('Access-Control-Allow-Origin', 'http://localhost:4200')
                    ->header('Access-Control-Allow-Credentials', 'true');
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
});