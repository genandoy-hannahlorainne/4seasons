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
use App\Http\Controllers\Api\PushSubscriptionController;
use App\Http\Controllers\Api\FcmDirectController;

// Health check route for CI/CD
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now(),
        'database' => 'connected'
    ]);
});

// Test route to check adviser data
Route::get('/test-adviser-data', function () {
    $advisers = \App\Models\Adviser::with('user')->get();

    $result = [];
    foreach ($advisers as $adviser) {
        $result[] = [
            'adviser_id' => $adviser->adviser_id,
            'user_id' => $adviser->user_id,
            'employee_id' => $adviser->employee_id,
            'birth_date' => $adviser->birth_date,
            'user_name' => $adviser->user ? $adviser->user->full_name : 'No user',
        ];
    }

    return response()->json([
        'success' => true,
        'count' => count($result),
        'advisers' => $result
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

// Debug route to diagnose SHDF authorization for a specific student
Route::get('/debug/shdf-auth/{studentId}', function (Request $request, int $studentId) {
    $user = $request->user();
    if (!$user) {
        return response()->json(['error' => 'Not authenticated'], 401);
    }

    $user->load('role');
    $student = \App\Models\Student::where('student_id', $studentId)->first();

    $role = strtolower(trim($user->role?->role_name ?? ''));

    $canFix = false;
    if ($student) {
        $canFix = (!empty($user->username) && !empty($student->student_number)
            && strtolower(trim($user->username)) === strtolower(trim($student->student_number)))
            || (\App\Models\Student::where('user_id', $user->user_id)->value('student_id') == $student->student_id);
    }

    return response()->json([
        'user' => [
            'user_id'    => $user->user_id,
            'username'   => $user->username,
            'role_id'    => $user->role_id,
            'role_name'  => $user->role?->role_name,
            'role_lower' => $role,
        ],
        'student' => $student ? [
            'student_id'     => $student->student_id,
            'student_number' => $student->student_number,
            'user_id'        => $student->user_id,
            'user_id_match'  => (int) $student->user_id === (int) $user->user_id,
        ] : null,
        'auth_result' => [
            'role_is_student'    => $role === 'student',
            'role_is_admin'      => $role === 'admin',
            'role_is_staff'      => in_array($role, ['clinic_staff', 'clinic staff']),
            'user_id_matches'    => $student ? (int) $student->user_id === (int) $user->user_id : false,
            'can_fix_mapping'    => $canFix,
            'would_authorize'    => $role === 'student'
                || $role === 'admin'
                || in_array($role, ['clinic_staff', 'clinic staff'])
                || ($student && (int) $student->user_id === (int) $user->user_id)
                || $canFix,
        ],
    ]);
})->middleware('auth:sanctum');

// VAPID public key — no auth needed so the frontend can subscribe before login
Route::get('/push/vapid-public-key', [PushSubscriptionController::class, 'vapidPublicKey']);

// Authentication routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
Route::get('/me', [AuthController::class, 'me'])->middleware('auth:sanctum');
Route::post('/refresh', [AuthController::class, 'refresh'])->middleware('auth:sanctum');
Route::post('/force-change-password', [AuthController::class, 'forceChangePassword'])->middleware('auth:sanctum');
Route::post('/request-password-change', [AuthController::class, 'requestPasswordChange'])->middleware('auth:sanctum');

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
        Route::put('/notifications/{id}/read', [AdminController::class, 'markNotificationAsRead']);
        Route::post('/notifications/mark-all-read', [AdminController::class, 'markAllNotificationsAsRead']);
        Route::post('/notifications/{id}/approve-password-change', [AdminController::class, 'approvePasswordChangeRequest']);
        Route::post('/notifications/{id}/dismiss', [AdminController::class, 'dismissPasswordChangeRequest']);
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

        // School years routes - specific routes MUST come before parameterized routes
        Route::get('/school-years', [SchoolYearController::class, 'index']);
        Route::get('/school-years/current', [SchoolYearController::class, 'getCurrent']);
        Route::get('/school-years/check-current-auto', [SchoolYearController::class, 'checkAutoSetCurrent']);
        Route::post('/school-years', [SchoolYearController::class, 'store']);
        Route::post('/school-years/set-current', [SchoolYearController::class, 'setCurrent']);
        Route::put('/school-years/{id}', [SchoolYearController::class, 'update']);
    });

    // Adviser routes
    Route::prefix('adviser')->middleware('role:adviser')->group(function () {
        Route::get('/dashboard', [AdviserController::class, 'getDashboard']);
        Route::get('/students', [AdviserController::class, 'getAdvisoryStudents']);
        Route::get('/advisory-students', [AdviserController::class, 'getAdvisoryStudents']);
        Route::get('/advisory-students-shdf', [AdviserController::class, 'getAdvisoryStudentsWithSHDF']);
        Route::get('/profile', [AdviserController::class, 'getProfile']);
        Route::put('/profile', [AdviserController::class, 'updateProfile']);
        Route::get('/health-heatmap', [AdviserController::class, 'getHealthHeatmap']);
        Route::get('/class-roster', [AdviserController::class, 'getClassRoster']);
        Route::get('/notifications', [AdviserController::class, 'getNotifications']);
        Route::get('/students/{studentId}/shdf-download', [AdviserController::class, 'downloadStudentSHDF']);
    });

    // Staff routes
    Route::prefix('staff')->middleware('role:clinic_staff')->group(function () {
        Route::get('/students', [StudentController::class, 'index']);
        Route::get('/sections', [AdminController::class, 'getSections']);
        Route::get('/dashboard', [DashboardController::class, 'getClinicOverview']);
        Route::get('/reports', [DashboardController::class, 'getStaffReportsAnalytics']);
        Route::get('/profile', [DashboardController::class, 'getStaffProfile']);
        Route::put('/profile', [DashboardController::class, 'updateStaffProfile']);
    });

    // Student routes
    Route::prefix('students')->group(function () {
        Route::get('/', [StudentController::class, 'index']);
        Route::get('/search', [StudentController::class, 'search']);
        Route::get('/qr/lookup', [StudentController::class, 'getByQr']);
        Route::get('/medical-data', [StudentController::class, 'getMedicalDataByUserId']);
        Route::get('/badges/summary', [StudentController::class, 'getBadgeSummary']);
        Route::get('/visit-summaries', [StudentController::class, 'getVisitSummaries']);
        Route::post('/', [StudentController::class, 'store']);
        Route::get('/{student}', [StudentController::class, 'show'])->name('students.show');
        Route::put('/{student}', [StudentController::class, 'update'])->name('students.update');
        Route::get('/{student}/medical-data', [StudentController::class, 'getMedicalData']);
        Route::put('/{student}/medical-data', [StudentController::class, 'updateMedicalData']);
        Route::get('/{student}/visits', [MedicalVisitController::class, 'getStudentVisits']);
        Route::get('/{student}/visit-history', [MedicalVisitController::class, 'getStudentVisitHistory']);
        Route::get('/{studentId}/badges', [StudentBadgeController::class, 'getStudentBadges']);
        Route::get('/{studentId}/badge-notifications', [StudentBadgeController::class, 'getBadgeNotifications']);
    });

    // Student badge metadata route
    Route::prefix('student')->group(function () {
        Route::get('/streak-badges/metadata', [StudentBadgeController::class, 'getStreakBadgeMetadata']);
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

    // Test endpoint for debugging time
    Route::get('/test-time', function () {
        return response()->json([
            'server_time' => now()->toDateTimeString(),
            'server_timezone' => now()->timezone->getName(),
            'server_timestamp' => now()->timestamp,
            'config_timezone' => config('app.timezone'),
            'php_timezone' => date_default_timezone_get()
        ]);
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
        Route::delete('/{id}', [EmergencyDrillController::class, 'destroy']);
        Route::post('/{id}/delete', [EmergencyDrillController::class, 'destroy']);
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

    // Push notification subscriptions
    Route::prefix('push')->group(function () {
        Route::post('/subscribe', [PushSubscriptionController::class, 'subscribe']);
        Route::delete('/unsubscribe', [PushSubscriptionController::class, 'unsubscribe']);
    });

    // Direct FCM messaging (server-to-server)
    Route::prefix('fcm')->middleware('role:admin,adviser,clinic_staff')->group(function () {
        Route::post('/send-to-user', [FcmDirectController::class, 'sendToUser']);
        Route::post('/send-to-token', [FcmDirectController::class, 'sendToToken']);
        Route::post('/send-to-topic', [FcmDirectController::class, 'sendToTopic']);
        Route::post('/send-to-condition', [FcmDirectController::class, 'sendToCondition']);
    });
});
