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
use App\Http\Controllers\Api\GradePromotionController;
use App\Http\Controllers\Api\SHDFController;

// Health check route for CI/CD
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now(),
        'database' => 'connected'
    ]);
});

// Debug route to test authentication
Route::get('/debug/auth', function (Request $request) {
    $user = $request->user();
    return response()->json([
        'authenticated' => !!$user,
        'user' => $user ? [
            'user_id' => $user->user_id,
            'username' => $user->username,
            'role' => $user->role->role_name ?? 'Unknown'
        ] : null,
        'token_present' => $request->bearerToken() ? 'yes' : 'no',
        'headers' => [
            'authorization' => $request->header('Authorization') ? 'present' : 'missing',
            'accept' => $request->header('Accept'),
            'content_type' => $request->header('Content-Type')
        ]
    ]);
})->middleware('auth:sanctum');

// Authentication routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
Route::get('/me', [AuthController::class, 'me'])->middleware('auth:sanctum');
Route::post('/refresh', [AuthController::class, 'refresh'])->middleware('auth:sanctum');
Route::post('/force-change-password', [AuthController::class, 'forceChangePassword'])->middleware('auth:sanctum');

// Protected routes
Route::middleware(['auth:sanctum', 'throttle:60,1', 'audit'])->group(function () {
    // Legacy route for compatibility - redirects to admin/users logic
    Route::get('/get-all-users', [AdminController::class, 'getAllUsers'])->middleware('role:admin');

    // Admin routes
    Route::prefix('admin')->middleware('role:admin')->group(function () {
        Route::get('/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/users', [AdminController::class, 'getAllUsers']);
        Route::get('/grade-levels', [AdminController::class, 'getGradeLevelsWithSections']);
        Route::get('/advisers', [AdminController::class, 'getAdvisers']);
        Route::get('/sections', [AdminController::class, 'getSections']);
        Route::post('/sections', [AdminController::class, 'createSection']);
        Route::put('/sections/{id}', [AdminController::class, 'updateSection']);
        Route::delete('/sections/{id}', [AdminController::class, 'deleteSection']);
        Route::post('/sections/assign-adviser', [AdminController::class, 'assignAdviserToSection']);
        Route::get('/sections/get-students', [AdminController::class, 'getSectionStudents']);
        Route::get('/notifications', [AdminController::class, 'getNotifications']);
        Route::get('/activity-logs', [AdminController::class, 'getActivityLogs']);
        Route::get('/health-risk-visualization', [AdminController::class, 'getHealthRiskVisualization']);
        Route::post('/users', [AdminController::class, 'createUser']);
        Route::put('/users/{id}', [AdminController::class, 'updateUser']);
        Route::delete('/users/{id}', [AdminController::class, 'deleteUser']);
        Route::post('/users/{id}/reset-password', [AdminController::class, 'resetPassword']);
        Route::post('/users/{id}/deactivate', [AdminController::class, 'deactivateUser']);
        Route::post('/users/{id}/activate', [AdminController::class, 'activateUser']);

        // Reports routes
        Route::get('/reports', [AdminController::class, 'getReports']);
        Route::get('/reports/principal-health-trends', [AdminController::class, 'getPrincipalHealthTrendReport']);

        // Settings routes
        Route::get('/settings', [AdminController::class, 'getSettings']);
        Route::put('/settings', [AdminController::class, 'updateSettings']);
        Route::get('/system-settings', [AdminController::class, 'getSystemSettings']);
        Route::put('/system-settings', [AdminController::class, 'updateSystemSettings']);

        // Backup & Recovery
        Route::get('/backup/history', [AdminController::class, 'getBackupHistory']);
        Route::post('/backup/create', [AdminController::class, 'createBackup']);
        Route::post('/backup/restore', [AdminController::class, 'restoreBackup']);
        Route::get('/backup/download/{filename}', [AdminController::class, 'downloadBackup']);
        Route::delete('/backup/{filename}', [AdminController::class, 'deleteBackup']);

        // Grade Promotion
        Route::get('/promotion/summary', [GradePromotionController::class, 'summary']);
        Route::post('/promotion/bulk', [GradePromotionController::class, 'bulk']);
        Route::post('/promotion/copy-sections', [GradePromotionController::class, 'copySections']);

        // School years routes
        Route::get('/school-years', [SchoolYearController::class, 'index']);
        Route::get('/school-years/current', [SchoolYearController::class, 'getCurrent']);
        Route::post('/school-years', [SchoolYearController::class, 'store']);
        Route::put('/school-years/{id}', [SchoolYearController::class, 'update']);
        Route::post('/school-years/set-current', [SchoolYearController::class, 'setCurrent']);
    });

    // Adviser routes
    Route::prefix('adviser')->middleware('role:adviser')->group(function () {
        Route::get('/dashboard', [AdviserController::class, 'getDashboard']);
        Route::get('/students', [AdviserController::class, 'getAdvisoryStudents']);
        Route::get('/advisory-students', [AdviserController::class, 'getAdvisoryStudents']);
        Route::get('/profile', [AdviserController::class, 'getProfile']);
        Route::put('/profile', [AdviserController::class, 'updateProfile']);
        Route::get('/health-heatmap', [AdviserController::class, 'getHealthHeatmap']);
        Route::get('/class-roster', [AdviserController::class, 'getClassRoster']);
        Route::get('/notifications', [AdviserController::class, 'getNotifications']);
    });

    // Staff routes
    Route::prefix('staff')->group(function () {
        Route::get('/students', [StudentController::class, 'index']);
        Route::get('/sections', [AdminController::class, 'getSections']);
        Route::get('/dashboard', [DashboardController::class, 'getClinicOverview']);
        Route::get('/reports', [DashboardController::class, 'getStaffReportsAnalytics']);
    });

    // Student routes
    Route::prefix('students')->group(function () {
        Route::get('/', [StudentController::class, 'index']);
        Route::get('/search', [StudentController::class, 'search']);
        Route::get('/medical-data', [StudentController::class, 'getMedicalDataByUserId']);
        Route::get('/{student}', [StudentController::class, 'show'])->name('students.show');
        Route::get('/{student}/medical-data', [StudentController::class, 'getMedicalData']);
        Route::put('/{student}/medical-data', [StudentController::class, 'updateMedicalData']);
        Route::get('/{student}/visits', [MedicalVisitController::class, 'getStudentVisits']);
        Route::get('/{student}/visit-history', [MedicalVisitController::class, 'getStudentVisitHistory']);
        Route::post('/', [StudentController::class, 'store']);
        Route::put('/{student}', [StudentController::class, 'update'])->name('students.update');
    });

    // Student badge routes
    Route::prefix('student')->group(function () {
        Route::get('/streak-badges/metadata', [StudentBadgeController::class, 'getStreakBadgeMetadata']);
    });

    // Student-specific badge routes
    Route::prefix('students')->group(function () {
        Route::get('/{studentId}/badges', [StudentBadgeController::class, 'getStudentBadges']);
        Route::get('/{studentId}/badge-notifications', [StudentBadgeController::class, 'getBadgeNotifications']);
    });

    // Badge notifications
    Route::prefix('notifications')->group(function () {
        Route::put('/{notificationId}/read', [StudentBadgeController::class, 'markNotificationAsRead']);
    });

    // Medical visits
    Route::prefix('medical-visits')->group(function () {
        Route::get('/', [MedicalVisitController::class, 'index']);
        Route::post('/', [MedicalVisitController::class, 'store'])->name('medical-visits.store');
        Route::get('/{id}', [MedicalVisitController::class, 'show'])->name('medical-visits.show');
    });

    // Emergency drills
    Route::prefix('emergency-drills')->group(function () {
        Route::get('/', [EmergencyDrillController::class, 'index']);
        Route::post('/', [EmergencyDrillController::class, 'store']);
        Route::get('/{id}', [EmergencyDrillController::class, 'show']);
        Route::post('/{id}/start', [EmergencyDrillController::class, 'start']);
        Route::post('/{id}/end', [EmergencyDrillController::class, 'end']);
        Route::post('/{id}/participants', [EmergencyDrillController::class, 'addParticipants']);
        Route::post('/{id}/scan', [EmergencyDrillController::class, 'scanParticipant']);
        Route::get('/{id}/dashboard', [EmergencyDrillController::class, 'dashboard']);
        Route::get('/{id}/search-users', [EmergencyDrillController::class, 'searchUsers']);
    });

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/dashboard/clinic/overview', [DashboardController::class, 'getClinicOverview']);

    // School years
    Route::prefix('school-years')->group(function () {
        Route::get('/', [SchoolYearController::class, 'index']);
        Route::post('/', [SchoolYearController::class, 'store']);
    });

    // Student badges
    Route::prefix('student-badges')->group(function () {
        Route::get('/{studentId}', [StudentBadgeController::class, 'getStudentBadges']);
    });

    // SHDF — Student Health Data Form
    Route::prefix('shdf')->group(function () {
        Route::get('/{studentId}', [SHDFController::class, 'show'])->name('shdf.show');
        Route::get('/{studentId}/status', [SHDFController::class, 'status']);
        Route::post('/', [SHDFController::class, 'store'])->name('shdf.store'); // Full form (legacy)
        Route::post('/basic', [SHDFController::class, 'storeBasic']); // Stage 1
        Route::post('/comprehensive', [SHDFController::class, 'storeComprehensive']); // Stage 2
        Route::get('/{studentId}/{schoolYearId}', [SHDFController::class, 'showByYear']);
    });
});
