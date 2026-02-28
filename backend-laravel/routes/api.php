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

// Force change password endpoint (requires authentication)
Route::post('/force-change-password', [AuthController::class, 'forceChangePassword'])->middleware('auth:sanctum');

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

// Fix student section assignments
Route::post('/test/fix-sections', function () {
    try {
        // Update Irish's section assignment
        $updated = \App\Models\Student::where('student_id', 26)
                                    ->update(['current_section_id' => 63]);
        
        return response()->json([
            'success' => true,
            'message' => 'Section assignment fixed',
            'updated_count' => $updated
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
    
    // Student endpoints
    Route::apiResource('students', \App\Http\Controllers\Api\StudentController::class);
    Route::get('/students/search/query', [\App\Http\Controllers\Api\StudentController::class, 'search']);
    Route::get('/students/qr/lookup', [\App\Http\Controllers\Api\StudentController::class, 'getByQr']);
    Route::get('/students/{student}/medical-data', [\App\Http\Controllers\Api\StudentController::class, 'getMedicalData']);
    Route::put('/students/{student}/physical-info', [\App\Http\Controllers\Api\StudentController::class, 'updatePhysicalInfo']);
    Route::post('/students/fix-section-assignments', [\App\Http\Controllers\Api\StudentController::class, 'fixSectionAssignments']);
    
    // Get all students for clinic staff with filtering
    Route::get('/staff/students', [\App\Http\Controllers\Api\StudentController::class, 'getAllStudentsForStaff']);
    
    // Medical visit endpoints
    Route::apiResource('medical-visits', \App\Http\Controllers\Api\MedicalVisitController::class);
    Route::get('/students/{student}/visits', [\App\Http\Controllers\Api\MedicalVisitController::class, 'getStudentVisits']);
    Route::get('/students/{student}/visit-history', [\App\Http\Controllers\Api\MedicalVisitController::class, 'getStudentVisitHistory']);
    Route::get('/medical-visits/emergency/recent', [\App\Http\Controllers\Api\MedicalVisitController::class, 'getEmergencyVisits']);
    Route::get('/medical-visits/statistics/summary', [\App\Http\Controllers\Api\MedicalVisitController::class, 'getStatistics']);
    
    // Dashboard endpoints
    Route::get('/dashboard/admin/stats', function(Request $request) {
        try {
            $days = $request->get('days', 30);
            $startDate = now()->subDays($days);
            
            $stats = [
                'total_users' => \App\Models\User::where('is_active', true)->count(),
                'total_students' => \App\Models\Student::where('is_active', true)->count(),
                'total_visits' => \App\Models\MedicalVisit::where('visit_datetime', '>=', $startDate)->count(),
                'emergency_visits' => \App\Models\MedicalVisit::where('visit_datetime', '>=', $startDate)
                                                            ->where('visit_type', 'Emergency')->count(),
                'visits_today' => \App\Models\MedicalVisit::whereDate('visit_datetime', today())->count(),
                'students_with_allergies' => \App\Models\Student::whereHas('allergies')->count(),
            ];
            
            return response()->json([
                'success' => true,
                'message' => 'Admin dashboard statistics retrieved successfully',
                'data' => $stats
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve admin statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    });
    
    Route::get('/dashboard/test', function() {
        return response()->json(['success' => true, 'message' => 'Dashboard test working']);
    });
    
    Route::get('/dashboard/clinic/overview', [\App\Http\Controllers\Api\DashboardController::class, 'getClinicOverview']);
    
    // Legacy user endpoint
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    
    // School Year Management endpoints
    Route::get('/admin/school-years', [\App\Http\Controllers\Api\SchoolYearController::class, 'index']);
    Route::post('/admin/school-years', [\App\Http\Controllers\Api\SchoolYearController::class, 'store']);
    Route::get('/admin/school-years/current', [\App\Http\Controllers\Api\SchoolYearController::class, 'getCurrent']);
    Route::post('/admin/school-years/set-current', [\App\Http\Controllers\Api\SchoolYearController::class, 'setCurrent']);
    
    Route::get('/admin/grade-levels', [\App\Http\Controllers\Api\SchoolYearController::class, 'getGradeLevels']);
    Route::get('/admin/sections', [\App\Http\Controllers\Api\SchoolYearController::class, 'getSections']);
    Route::post('/admin/sections', [\App\Http\Controllers\Api\SchoolYearController::class, 'createSection']);
    Route::post('/admin/sections/assign-adviser', [\App\Http\Controllers\Api\SchoolYearController::class, 'assignAdviser']);
    Route::get('/admin/sections/students', [\App\Http\Controllers\Api\SchoolYearController::class, 'getSectionStudents']);
    
    Route::get('/admin/advisers', [\App\Http\Controllers\Api\SchoolYearController::class, 'getAdvisers']);
    
    // Get all sections for filtering (clinic staff student records)
    Route::get('/sections', [\App\Http\Controllers\Api\SchoolYearController::class, 'getAllSections']);
    
    // Adviser endpoints
    Route::get('/adviser/profile', [\App\Http\Controllers\Api\AdviserController::class, 'getProfile']);
    Route::put('/adviser/profile', [\App\Http\Controllers\Api\AdviserController::class, 'updateProfile']);
    Route::get('/adviser/dashboard', [\App\Http\Controllers\Api\AdviserController::class, 'getDashboard']);
    Route::get('/adviser/health-heatmap', [\App\Http\Controllers\Api\AdviserController::class, 'getHealthHeatmap']);
    Route::get('/adviser/class-roster', [\App\Http\Controllers\Api\AdviserController::class, 'getClassRoster']);
    Route::get('/adviser/advisory-students', [\App\Http\Controllers\Api\AdviserController::class, 'getAdvisoryStudents']);
    
    // Future API endpoints will be added here
    // Route::post('medical-visits', [MedicalVisitController::class, 'store']);
});
