<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Health check endpoint
Route::get('/health', function () {
    return response()->json([
        'success' => true,
        'message' => 'Medical Record System API is running',
        'version' => '1.0.0',
        'timestamp' => now()->toISOString()
    ]);
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    
    // Future API endpoints will be added here
    // Route::apiResource('students', StudentController::class);
    // Route::post('medical-visits', [MedicalVisitController::class, 'store']);
});
