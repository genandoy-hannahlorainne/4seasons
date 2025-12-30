<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\AdviserController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\MedicalRecordController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// CORS preflight handling for all routes
Route::options('{any}', function (Request $request) {
    return response('', 200)
        ->header('Access-Control-Allow-Origin', 'http://localhost:4200')
        ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, user_id')
        ->header('Access-Control-Allow-Credentials', 'true');
})->where('any', '.*');

// Test route outside of middleware groups
Route::get('/api/direct-test', function () {
    return response()->json(['message' => 'Direct test working', 'timestamp' => now()]);
});

// Direct medical record test
Route::get('/api/direct-medical', function (Request $request) {
    try {
        $userId = $request->query('user_id', 19); // Default to user 19 for testing
        
        $student = DB::table('students')->where('user_id', $userId)->first();
        
        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'Student not found',
                'user_id' => $userId
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Direct medical endpoint working',
            'student' => $student
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
});

// Apply CORS to all API routes
Route::group(['middleware' => ['api']], function () {
    
    // Authentication routes (public)
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);

    // General profile route (public for now)
    Route::get('/profile', [AuthController::class, 'getProfile']);

    // Test routes (public) - Medical data endpoint
    Route::get('/test', function (Request $request) {
        // Check if this is a medical data request
        if ($request->has('medical')) {
            try {
                $userId = $request->query('user_id') ?: $request->header('user_id') ?: 19;
                
                $student = DB::table('students')->where('user_id', $userId)->first();
                
                if (!$student) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Student not found for user_id: ' . $userId
                    ]);
                }

                // Get allergies
                $allergies = DB::table('allergies')->where('student_id', $student->student_id)->get();

                return response()->json([
                    'success' => true,
                    'data' => [
                        'personal_info' => [
                            'student_id' => $student->student_id,
                            'student_number' => $student->student_number,
                            'full_name' => trim($student->first_name . ' ' . ($student->middle_name ? $student->middle_name . ' ' : '') . $student->last_name),
                            'birth_date' => $student->birth_date,
                            'gender' => $student->gender,
                            'blood_type' => $student->blood_type,
                            'address' => $student->address,
                            'emergency_contact' => $student->emergency_contact,
                            'grade_level' => $student->grade_level,
                            'section' => $student->section
                        ],
                        'allergies' => $allergies->map(function($allergy) {
                            return [
                                'allergy_id' => $allergy->allergy_id,
                                'allergy_text' => $allergy->allergy_text,
                                'severity' => $allergy->severity,
                                'recorded_at' => $allergy->recorded_at
                            ];
                        }),
                        'recent_visits_count' => 0,
                        'total_visits_count' => 0
                    ]
                ]);
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error retrieving medical record: ' . $e->getMessage()
                ]);
            }
        }
        
        // Default test response
        return response()->json([
            'success' => true,
            'message' => 'Laravel API is working!',
            'timestamp' => now(),
            'version' => '1.0.0'
        ]);
    });

    // Medical record test endpoint
    Route::get('/test-medical-data', function (Request $request) {
        try {
            $userId = $request->query('user_id', 19); // Default to user 19
            
            $student = DB::table('students')->where('user_id', $userId)->first();
            
            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student not found for user_id: ' . $userId
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'personal_info' => [
                        'student_id' => $student->student_id,
                        'student_number' => $student->student_number,
                        'full_name' => trim($student->first_name . ' ' . ($student->middle_name ? $student->middle_name . ' ' : '') . $student->last_name),
                        'birth_date' => $student->birth_date,
                        'gender' => $student->gender,
                        'blood_type' => $student->blood_type,
                        'address' => $student->address,
                        'emergency_contact' => $student->emergency_contact,
                        'grade_level' => $student->grade_level,
                        'section' => $student->section
                    ],
                    'allergies' => [],
                    'recent_visits_count' => 0,
                    'total_visits_count' => 0
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ]);
        }
    });

    Route::get('/test-db', function () {
        try {
            DB::connection()->getPdo();
            $userCount = DB::table('users')->count();
            return response()->json([
                'success' => true,
                'message' => 'Database connection successful',
                'database' => config('database.connections.mysql.database'),
                'user_count' => $userCount
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Database connection failed',
                'error' => $e->getMessage()
            ], 500);
        }
    });

    // Simple registration test
    Route::post('/test-register', function (Request $request) {
        try {
            return response()->json([
                'success' => true,
                'message' => 'Test registration endpoint working',
                'received_data' => $request->all()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error in test registration',
                'error' => $e->getMessage()
            ], 500);
        }
    });

    // Debug registration endpoint
    Route::post('/debug-register', function (Request $request) {
        try {
            $step = 1;
            $debug = ['step' => $step, 'message' => 'Starting registration debug'];
            
            // Step 1: Check input
            $step++;
            $debug['step'] = $step;
            $debug['input'] = $request->all();
            
            // Step 2: Check database connection
            $step++;
            $debug['step'] = $step;
            DB::connection()->getPdo();
            $debug['database'] = 'Connected';
            
            // Step 3: Check roles table
            $step++;
            $debug['step'] = $step;
            $roles = DB::table('roles')->get();
            $debug['roles'] = $roles;
            
            // Step 4: Test user insertion
            $step++;
            $debug['step'] = $step;
            $testUserId = DB::table('users')->insertGetId([
                'role_id' => 2, // Student role
                'username' => 'debug_test_' . time(),
                'password_hash' => Hash::make('password123'),
                'email' => 'debug@test.com',
                'full_name' => 'Debug Test User',
                'created_at' => now(),
                'updated_at' => now()
            ]);
            $debug['test_user_id'] = $testUserId;
            
            // Step 5: Clean up test user
            DB::table('users')->where('user_id', $testUserId)->delete();
            $debug['cleanup'] = 'Test user deleted';
            
            return response()->json([
                'success' => true,
                'message' => 'Debug registration completed successfully',
                'debug' => $debug
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Debug registration failed at step ' . $step,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'debug' => $debug ?? []
            ], 500);
        }
    });

    // Simple test routes without controllers
    Route::get('/simple-test', function () {
        return response()->json(['message' => 'Simple test working']);
    });

    Route::get('/medical-test', function (Request $request) {
        try {
            $userId = $request->query('user_id', $request->header('user_id'));
            
            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'User ID not provided',
                    'headers' => $request->headers->all(),
                    'query' => $request->query->all()
                ], 400);
            }

            // Get student record
            $student = DB::table('students')->where('user_id', $userId)->first();
            
            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'personal_info' => [
                        'student_id' => $student->student_id,
                        'student_number' => $student->student_number,
                        'full_name' => $student->first_name . ' ' . $student->last_name,
                        'birth_date' => $student->birth_date,
                        'gender' => $student->gender,
                        'blood_type' => $student->blood_type,
                        'address' => $student->address,
                        'emergency_contact' => $student->emergency_contact,
                        'grade_level' => $student->grade_level,
                        'section' => $student->section
                    ],
                    'allergies' => [],
                    'recent_visits_count' => 0,
                    'total_visits_count' => 0
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    });

    // Test medical record endpoint
    Route::get('/test-medical', function (Request $request) {
        return response()->json([
            'success' => true,
            'message' => 'Test medical endpoint working',
            'headers' => $request->headers->all(),
            'query' => $request->query->all(),
            'user_id_header' => $request->header('user_id'),
            'user_id_query' => $request->query('user_id')
        ]);
    });

    // Simple medical record endpoint (working version)
    Route::get('/medical-record', function (Request $request) {
        try {
            $userId = $request->query('user_id') ?: $request->header('user_id');
            
            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'User ID not provided',
                    'debug' => [
                        'headers' => $request->headers->all(),
                        'query' => $request->query->all()
                    ]
                ], 400);
            }

            // Get student record
            $student = DB::table('students')->where('user_id', $userId)->first();
            
            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student not found for user_id: ' . $userId
                ], 404);
            }

            // Get allergies
            $allergies = DB::table('allergies')->where('student_id', $student->student_id)->get();

            // Get visit counts
            $recentVisitsCount = DB::table('medical_visits')
                ->where('student_id', $student->student_id)
                ->where('visit_datetime', '>=', now()->subDays(30))
                ->count();
                
            $totalVisitsCount = DB::table('medical_visits')
                ->where('student_id', $student->student_id)
                ->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'personal_info' => [
                        'student_id' => $student->student_id,
                        'student_number' => $student->student_number,
                        'full_name' => trim($student->first_name . ' ' . ($student->middle_name ? $student->middle_name . ' ' : '') . $student->last_name),
                        'birth_date' => $student->birth_date,
                        'gender' => $student->gender,
                        'blood_type' => $student->blood_type,
                        'address' => $student->address,
                        'emergency_contact' => $student->emergency_contact,
                        'grade_level' => $student->grade_level,
                        'section' => $student->section
                    ],
                    'allergies' => $allergies->map(function($allergy) {
                        return [
                            'allergy_id' => $allergy->allergy_id,
                            'allergy_text' => $allergy->allergy_text,
                            'severity' => $allergy->severity,
                            'recorded_at' => $allergy->recorded_at
                        ];
                    }),
                    'recent_visits_count' => $recentVisitsCount,
                    'total_visits_count' => $totalVisitsCount
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving medical record: ' . $e->getMessage(),
                'debug' => [
                    'file' => $e->getFile(),
                    'line' => $e->getLine()
                ]
            ], 500);
        }
    });

    // Protected routes (require user_id in request for now)
    Route::group(function () {
        
        // Student routes
        Route::get('/student/profile', [StudentController::class, 'getProfile']);
        Route::put('/student/profile', [StudentController::class, 'updateProfile']);
        Route::get('/student/medical-data', [StudentController::class, 'getMedicalData']);
        Route::get('/student/qr', [StudentController::class, 'getQR']);
        
        // Medical Records routes
        Route::get('/medical-record', [MedicalRecordController::class, 'getMedicalRecord']);
        Route::get('/medical-visits', [MedicalRecordController::class, 'getMedicalVisits']);
        Route::get('/medical-visits/{visitId}', [MedicalRecordController::class, 'getVisitDetails']);
        Route::put('/medical-record', [MedicalRecordController::class, 'updateMedicalInfo']);
        
        // Adviser routes
        Route::get('/adviser/dashboard', [AdviserController::class, 'getDashboard']);
        
        // Staff routes
        Route::get('/staff/dashboard', [StaffController::class, 'getDashboard']);
        
        // Password change
        Route::post('/change-password', [AuthController::class, 'changePassword']);
    });

    // QR Code generation (public)
    Route::get('/generate-qr-image/{token}', [StudentController::class, 'generateQRImage']);
});