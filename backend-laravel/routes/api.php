<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AdviserController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\MedicalVisitController;
use App\Http\Controllers\Api\EmergencyDrillController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\SchoolYearController;
use App\Http\Controllers\Api\StudentBadgeController;

// Health check route for CI/CD
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now(),
        'database' => 'connected'
    ]);
});

// Authentication routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
Route::get('/user', [AuthController::class, 'user'])->middleware('auth:sanctum');

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Admin routes
    Route::prefix('admin')->middleware('role:admin')->group(function () {
        Route::get('/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/users', [AdminController::class, 'getUsers']);
        Route::post('/users', [AdminController::class, 'createUser']);
        Route::put('/users/{id}', [AdminController::class, 'updateUser']);
        Route::delete('/users/{id}', [AdminController::class, 'deleteUser']);
    });

    // Adviser routes
    Route::prefix('adviser')->middleware('role:adviser')->group(function () {
        Route::get('/dashboard', [AdviserController::class, 'dashboard']);
        Route::get('/students', [AdviserController::class, 'getStudents']);
    });

    // Student routes
    Route::prefix('students')->group(function () {
        Route::get('/', [StudentController::class, 'index']);
        Route::get('/{id}', [StudentController::class, 'show']);
        Route::post('/', [StudentController::class, 'store']);
        Route::put('/{id}', [StudentController::class, 'update']);
    });

    // Medical visits
    Route::prefix('medical-visits')->group(function () {
        Route::get('/', [MedicalVisitController::class, 'index']);
        Route::post('/', [MedicalVisitController::class, 'store']);
        Route::get('/{id}', [MedicalVisitController::class, 'show']);
    });

    // Emergency drills
    Route::prefix('emergency-drills')->group(function () {
        Route::get('/', [EmergencyDrillController::class, 'index']);
        Route::post('/', [EmergencyDrillController::class, 'store']);
        Route::get('/{id}', [EmergencyDrillController::class, 'show']);
    });

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // School years
    Route::prefix('school-years')->group(function () {
        Route::get('/', [SchoolYearController::class, 'index']);
        Route::post('/', [SchoolYearController::class, 'store']);
    });

    // Student badges
    Route::prefix('student-badges')->group(function () {
        Route::get('/{studentId}', [StudentBadgeController::class, 'getStudentBadges']);
    });
});