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
    Route::apiResource('students', \App\Http\Controllers\Api\StudentController::class);
    Route::get('/students/search/query', [\App\Http\Controllers\Api\StudentController::class, 'search']);
    Route::get('/students/qr/lookup', [\App\Http\Controllers\Api\StudentController::class, 'getByQr']);
    Route::get('/students/{student}/medical-data', [\App\Http\Controllers\Api\StudentController::class, 'getMedicalData']);
    Route::put('/students/{student}/medical-data', [\App\Http\Controllers\Api\StudentController::class, 'updateMedicalData']);
    Route::put('/students/{student}/physical-info', [\App\Http\Controllers\Api\StudentController::class, 'updatePhysicalInfo']);
    
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
    
    // Get all sections for filtering (clinic staff student records)
    Route::get('/sections', [\App\Http\Controllers\Api\SchoolYearController::class, 'getAllSections']);
    
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
