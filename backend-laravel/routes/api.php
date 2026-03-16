<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
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

// Debug endpoint for authentication status
Route::get('/debug/auth', function (Request $request) {
    try {
        $user = $request->user();
        $token = $request->bearerToken();
        
        return response()->json([
            'success' => true,
            'authenticated' => !!$user,
            'user' => $user ? [
                'user_id' => $user->user_id,
                'username' => $user->username,
                'role_name' => $user->role?->role_name,
                'is_active' => $user->is_active
            ] : null,
            'token_present' => !!$token,
            'token_length' => $token ? strlen($token) : 0,
            'headers' => [
                'authorization' => $request->header('Authorization'),
                'accept' => $request->header('Accept'),
                'user_agent' => $request->header('User-Agent')
            ]
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage(),
            'authenticated' => false
        ], 500);
    }
})->middleware('auth:sanctum');

// Debug endpoint for database connection
Route::get('/debug/database', function () {
    try {
        $usersCount = \App\Models\User::count();
        $rolesCount = \App\Models\Role::count();
        
        $roles = \App\Models\Role::all()->map(function($role) {
            return [
                'role_id' => $role->role_id,
                'role_name' => $role->role_name,
                'users_count' => $role->users()->count()
            ];
        });
        
        $sampleUsers = \App\Models\User::with('role')->take(5)->get()->map(function($user) {
            return [
                'user_id' => $user->user_id,
                'username' => $user->username,
                'role_id' => $user->role_id,
                'role_name' => $user->role ? $user->role->role_name : 'NULL',
                'is_active' => $user->is_active
            ];
        });
        
        return response()->json([
            'success' => true,
            'database_connection' => 'OK',
            'users_count' => $usersCount,
            'roles_count' => $rolesCount,
            'roles' => $roles,
            'sample_users' => $sampleUsers
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage(),
            'database_connection' => 'FAILED'
        ], 500);
    }
});

// Authentication endpoints (public)
Route::post('/login', [AuthController::class, 'login']);

// Debug endpoint for frontend troubleshooting (public for debugging)
Route::get('/debug/student-data/{userId}', function($userId) {
    try {
        $user = \App\Models\User::with(['student', 'role'])->find($userId);
        if (!$user || !$user->student) {
            return response()->json(['error' => 'Student not found'], 404);
        }
        
        $student = $user->student;
        return response()->json([
            'user_info' => [
                'user_id' => $user->user_id,
                'username' => $user->username,
                'role' => $user->role->role_name ?? 'Unknown'
            ],
            'student_info' => [
                'student_id' => $student->student_id,
                'student_number' => $student->student_number,
                'first_name' => $student->first_name,
                'last_name' => $student->last_name,
                'full_name' => $student->full_name,
                'grade_level' => $student->grade_level,
                'section' => $student->section
            ],
            'api_endpoints_that_should_work' => [
                'profile' => "/api/students/{$student->student_id}",
                'profile_by_user_id' => "/api/students/{$user->user_id}",
                'medical_data' => "/api/students/medical-data?user_id={$user->user_id}"
            ]
        ]);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
});

// Debug endpoint to test current profile API response
Route::get('/debug/profile-response/{userId}', function($userId) {
    try {
        $student = \App\Models\Student::where('user_id', $userId)
            ->with([
                'user',
                'medicalHistory',
                'allergies',
                'currentAdviser',
                'currentSection.adviser',
                'medicalVisits' => function($query) {
                    $query->with('vitals')->orderBy('visit_datetime', 'desc')->limit(10);
                }
            ])
            ->first();
            
        if (!$student) {
            return response()->json(['error' => 'Student not found'], 404);
        }

        // Resolve adviser information
        $resolvedAdviser = $student->currentAdviser ?: ($student->currentSection ? $student->currentSection->adviser : null);

        return response()->json([
            'debug_info' => [
                'student_found' => true,
                'has_current_adviser' => !!$student->currentAdviser,
                'has_current_section' => !!$student->currentSection,
                'section_has_adviser' => !!($student->currentSection && $student->currentSection->adviser),
                'resolved_adviser' => !!$resolvedAdviser,
                'adviser_name' => $resolvedAdviser ? $resolvedAdviser->full_name : null,
                'adviser_contact' => $resolvedAdviser ? $resolvedAdviser->phone : null,
            ],
            'student_data' => [
                'student_id' => $student->student_id,
                'student_number' => $student->student_number,
                'full_name' => $student->full_name,
                'grade_level' => $student->grade_level,
                'section' => $student->section,
                'adviser_name' => $resolvedAdviser ? $resolvedAdviser->full_name : null,
                'adviser_contact' => $resolvedAdviser ? $resolvedAdviser->phone : null,
            ]
        ]);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()], 500);
    }
});

// Authentication endpoints (public)
Route::post('/login', [AuthController::class, 'login']);

// Force change password endpoint (requires authentication)
Route::post('/force-change-password', [AuthController::class, 'forceChangePassword'])->middleware('auth:sanctum');

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Authentication endpoints (protected)
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
    Route::get('/me', [AuthController::class, 'me']);
    
    // Student endpoints
    Route::get('/students/search/query', [\App\Http\Controllers\Api\StudentController::class, 'search']);
    Route::get('/students/qr/lookup', [\App\Http\Controllers\Api\StudentController::class, 'getByQr']);
    Route::get('/students/medical-data', [\App\Http\Controllers\Api\StudentController::class, 'getMedicalDataByUserId']);
    Route::apiResource('students', \App\Http\Controllers\Api\StudentController::class);
    Route::get('/students/{student}/medical-data', [\App\Http\Controllers\Api\StudentController::class, 'getMedicalData']);
    Route::put('/students/{student}/medical-data', [\App\Http\Controllers\Api\StudentController::class, 'updateMedicalData']);
    Route::put('/students/{student}/physical-info', [\App\Http\Controllers\Api\StudentController::class, 'updatePhysicalInfo']);
    Route::get('/student/streak-badges/metadata', [\App\Http\Controllers\Api\StudentBadgeController::class, 'getStreakBadgeMetadata']);
    Route::post('/student/badges/generate-text', [\App\Http\Controllers\Api\StudentBadgeController::class, 'generateBadgeText']);
    
    // Get all students for clinic staff with filtering
    Route::get('/staff/students', [\App\Http\Controllers\Api\StudentController::class, 'getAllStudentsForStaff']);
    Route::get('/staff/sections', [\App\Http\Controllers\Api\SchoolYearController::class, 'getAllSections']);
    
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
    
    Route::get('/dashboard/clinic/overview', [\App\Http\Controllers\Api\DashboardController::class, 'getClinicOverview']);
    Route::get('/staff/reports', [\App\Http\Controllers\Api\DashboardController::class, 'getStaffReportsAnalytics']);
    
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
    
    // Admin student management endpoints
    Route::get('/admin/grade-levels/sections', [\App\Http\Controllers\Api\AdminController::class, 'getGradeLevelsWithSections']);
    Route::get('/admin/sections/grade/{grade_level}', [\App\Http\Controllers\Api\AdminController::class, 'getSectionsForGrade']);
    Route::post('/admin/students', [\App\Http\Controllers\Api\AdminController::class, 'createStudent']);
    Route::get('/admin/health-risk-visualization', [\App\Http\Controllers\Api\AdminController::class, 'getHealthRiskVisualization']);
    Route::get('/admin/health-recommendations', [\App\Http\Controllers\Api\AdminController::class, 'getHealthRecommendations']);
    Route::get('/admin/bmi-trends', [\App\Http\Controllers\Api\AdminController::class, 'getBMITrends']);
    Route::get('/admin/reports', [\App\Http\Controllers\Api\AdminController::class, 'getReports']);
    Route::get('/admin/reports/principal-health-trends', [\App\Http\Controllers\Api\AdminController::class, 'getPrincipalHealthTrendReport']);

    // Get all users (admin, faculty, clinic staff, etc)
    Route::get('/get-all-users', [\App\Http\Controllers\Api\AdminController::class, 'getAllUsers']);
    
    // User management endpoints
    Route::post('/admin/create-user', [\App\Http\Controllers\Api\AdminController::class, 'createUser']);
    Route::put('/admin/users/{userId}', [\App\Http\Controllers\Api\AdminController::class, 'updateUser']);
    Route::post('/admin/users/{userId}/reset-password', [\App\Http\Controllers\Api\AdminController::class, 'resetPassword']);
    Route::post('/admin/users/{userId}/activate', [\App\Http\Controllers\Api\AdminController::class, 'activateUser']);
    Route::post('/admin/users/{userId}/deactivate', [\App\Http\Controllers\Api\AdminController::class, 'deactivateUser']);
    Route::delete('/admin/users/{userId}', [\App\Http\Controllers\Api\AdminController::class, 'deleteUser']);
    
    // Bulk operations
    Route::post('/admin/students/bulk-import', [\App\Http\Controllers\Api\AdminController::class, 'bulkImportStudents']);
    
    // System settings
    Route::get('/admin/system-settings', [\App\Http\Controllers\Api\AdminController::class, 'getSystemSettings']);
    Route::put('/admin/system-settings', [\App\Http\Controllers\Api\AdminController::class, 'updateSystemSettings']);
    
    // Admin notification management
    Route::get('/admin/notifications', [\App\Http\Controllers\Api\AdminController::class, 'getNotifications']);
    Route::post('/admin/notifications/{notificationId}/read', [\App\Http\Controllers\Api\AdminController::class, 'markNotificationAsRead']);
    Route::post('/admin/notifications/mark-all-read', [\App\Http\Controllers\Api\AdminController::class, 'markAllNotificationsAsRead']);
    Route::post('/admin/send-parent-sms', [\App\Http\Controllers\Api\AdminController::class, 'sendParentSMS']);
    
    // Admin activity logs
    Route::get('/admin/activity-logs', [\App\Http\Controllers\Api\AdminController::class, 'getActivityLogs']);
    
    // Admin backup operations
    Route::post('/admin/backup/create', [\App\Http\Controllers\Api\AdminController::class, 'createBackup']);
    Route::post('/admin/backup/restore', [\App\Http\Controllers\Api\AdminController::class, 'restoreBackup']);
    
    // Admin health analytics
    Route::get('/admin/health-recommendations', [\App\Http\Controllers\Api\AdminController::class, 'getHealthRecommendations']);
    Route::get('/admin/bmi-trends', [\App\Http\Controllers\Api\AdminController::class, 'getBMITrends']);
    
    // Get all sections for filtering (clinic staff student records)
    Route::get('/sections', [\App\Http\Controllers\Api\SchoolYearController::class, 'getAllSections']);
    
    // Debug endpoint for adviser authentication (no auth required)
    Route::get('/debug/adviser-auth-noauth', function(Request $request) {
        try {
            $token = $request->bearerToken();
            $user = null;
            
            if ($token) {
                $accessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($token);
                if ($accessToken) {
                    $user = $accessToken->tokenable;
                }
            }
            
            return response()->json([
                'success' => true,
                'token_present' => !!$token,
                'token_valid' => !!$accessToken ?? false,
                'user' => $user ? [
                    'user_id' => $user->user_id,
                    'username' => $user->username,
                    'full_name' => $user->full_name,
                    'role_id' => $user->role_id,
                    'is_active' => $user->is_active,
                    'is_adviser' => intval($user->role_id) === 3
                ] : null,
                'headers' => [
                    'authorization' => $request->header('Authorization'),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    });

    // Debug endpoint for adviser authentication
    Route::get('/debug/adviser-auth', function(Request $request) {
        try {
            $user = $request->user();
            
            return response()->json([
                'success' => true,
                'authenticated' => !!$user,
                'user' => $user ? [
                    'user_id' => $user->user_id,
                    'username' => $user->username,
                    'full_name' => $user->full_name,
                    'role_id' => $user->role_id,
                    'role_name' => $user->role?->role_name,
                    'is_active' => $user->is_active,
                    'is_adviser' => intval($user->role_id) === 3
                ] : null,
                'token_present' => !!$request->bearerToken(),
                'headers' => [
                    'authorization' => $request->header('Authorization'),
                    'accept' => $request->header('Accept'),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'authenticated' => false
            ], 500);
        }
    });

    // Adviser endpoints
    Route::get('/adviser/profile', [\App\Http\Controllers\Api\AdviserController::class, 'getProfile']);
    Route::put('/adviser/profile', [\App\Http\Controllers\Api\AdviserController::class, 'updateProfile']);
    Route::get('/adviser/dashboard', [\App\Http\Controllers\Api\AdviserController::class, 'getDashboard']);
    Route::get('/adviser/health-heatmap', [\App\Http\Controllers\Api\AdviserController::class, 'getHealthHeatmap']);
    Route::get('/adviser/class-roster', [\App\Http\Controllers\Api\AdviserController::class, 'getClassRoster']);
    Route::get('/adviser/advisory-students', [\App\Http\Controllers\Api\AdviserController::class, 'getAdvisoryStudents']);
    Route::get('/adviser/notifications', [\App\Http\Controllers\Api\AdviserController::class, 'getNotifications']);
    
    // Emergency Drill Management endpoints
    Route::apiResource('emergency-drills', \App\Http\Controllers\Api\EmergencyDrillController::class);
    Route::post('/emergency-drills/{id}/start', [\App\Http\Controllers\Api\EmergencyDrillController::class, 'start']);
    Route::post('/emergency-drills/{id}/end', [\App\Http\Controllers\Api\EmergencyDrillController::class, 'end']);
    Route::post('/emergency-drills/{id}/participants', [\App\Http\Controllers\Api\EmergencyDrillController::class, 'addParticipants']);
    Route::post('/emergency-drills/{id}/scan', [\App\Http\Controllers\Api\EmergencyDrillController::class, 'scanParticipant']);
    Route::get('/emergency-drills/{id}/dashboard', [\App\Http\Controllers\Api\EmergencyDrillController::class, 'dashboard']);
    Route::get('/emergency-drills/{id}/search-users', [\App\Http\Controllers\Api\EmergencyDrillController::class, 'searchUsers']);
});
