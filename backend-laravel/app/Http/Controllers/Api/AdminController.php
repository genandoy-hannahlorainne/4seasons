<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\BaseController;
use App\Models\User;
use App\Models\Student;
use App\Models\Section;
use App\Models\GradeLevel;
use App\Models\SchoolYear;
use App\Mail\UserAccountCreated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;

class AdminController extends BaseController
{
    /**
     * Get sections for a specific grade level (for admin forms)
     */
    public function getSectionsForGrade($gradeLevel)
    {
        try {
            $validator = Validator::make(['grade_level' => $gradeLevel], [
                'grade_level' => 'required|integer|min:1|max:12'
            ]);

            if ($validator->fails()) {
                return $this->sendError('Validation Error', $validator->errors()->first());
            }

            $adminGradeLevel = (int)$gradeLevel;
            
            // Map admin grade levels to actual grade numbers
            // Admin uses 1-3 for Grade 7-9, 4-6 for Grade 10-12
            $gradeMapping = [
                1 => 7,   // Admin Grade 1 = Grade 7
                2 => 8,   // Admin Grade 2 = Grade 8
                3 => 9,   // Admin Grade 3 = Grade 9
                4 => 10,  // Admin Grade 4 = Grade 10
                5 => 11,  // Admin Grade 5 = Grade 11
                6 => 12   // Admin Grade 6 = Grade 12
            ];

            $actualGradeNumber = $gradeMapping[$adminGradeLevel] ?? $adminGradeLevel;

            // Get the grade level
            $gradeLevel = GradeLevel::where('level_number', $actualGradeNumber)->first();
            
            if (!$gradeLevel) {
                return $this->sendError('Grade level not found');
            }

            // Get sections for this grade level
            $sections = Section::where('grade_level_id', $gradeLevel->id)
                ->where('is_active', true)
                ->orderBy('section_name')
                ->get()
                ->map(function($section) {
                    return [
                        'id' => $section->id,
                        'section_name' => $section->section_name,
                        'capacity' => $section->capacity,
                        'current_enrollment' => $section->current_enrollment ?? 0
                    ];
                });

            return $this->sendResponse([
                'grade_level' => [
                    'admin_level' => $adminGradeLevel,
                    'actual_grade' => $actualGradeNumber,
                    'grade_name' => $gradeLevel->level_name
                ],
                'sections' => $sections
            ], 'Sections retrieved successfully');

        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve sections', $e->getMessage());
        }
    }

    /**
     * Create a new student account
     */
    public function createStudent(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'student_number' => 'required|string|unique:students,student_number',
                'first_name' => 'required|string|max:80',
                'last_name' => 'required|string|max:80',
                'middle_name' => 'nullable|string|max:80',
                'birth_date' => 'required|date',
                'gender' => 'required|in:M,F',
                'grade_level' => 'required|integer|min:1|max:12',
                'section_id' => 'required|integer|exists:sections,id',
                'email' => 'nullable|email|unique:users,email',
                'phone' => 'nullable|string|max:20',
                'emergency_contact_name' => 'nullable|string|max:150',
                'emergency_contact_phone' => 'nullable|string|max:20'
            ]);

            if ($validator->fails()) {
                return $this->sendError('Validation Error', $validator->errors()->first());
            }

            DB::beginTransaction();

            // Get current school year
            $currentSchoolYear = SchoolYear::where('is_current', true)->first();
            if (!$currentSchoolYear) {
                return $this->sendError('No current school year set');
            }

            // Verify section exists and is active
            $section = Section::with('gradeLevel')->find($request->section_id);
            if (!$section || !$section->is_active) {
                return $this->sendError('Invalid section selected');
            }

            // Map admin grade level to actual grade
            $gradeMapping = [
                1 => 7, 2 => 8, 3 => 9, 4 => 10, 5 => 11, 6 => 12
            ];
            $actualGradeNumber = $gradeMapping[$request->grade_level] ?? $request->grade_level;

            // Verify section matches the selected grade level
            if ($section->gradeLevel->level_number !== $actualGradeNumber) {
                return $this->sendError('Section does not match the selected grade level');
            }

            // Generate temporary password
            $tempPassword = $this->generateTempPassword();
            $passwordHash = Hash::make($tempPassword);

            // Create user account
            $user = User::create([
                'role_id' => 2, // Student role
                'username' => $request->student_number,
                'password_hash' => $passwordHash,
                'email' => $request->email,
                'phone' => $request->phone,
                'full_name' => trim($request->first_name . ' ' . ($request->middle_name ? $request->middle_name . ' ' : '') . $request->last_name),
                'password_must_change' => true,
                'is_active' => true
            ]);

            // Create student profile
            $student = Student::create([
                'user_id' => $user->user_id,
                'student_number' => $request->student_number,
                'first_name' => $request->first_name,
                'middle_name' => $request->middle_name,
                'last_name' => $request->last_name,
                'birth_date' => $request->birth_date,
                'gender' => $request->gender,
                'grade_level' => $section->gradeLevel->level_name,
                'section' => $section->section_name,
                'current_grade_level_id' => $section->grade_level_id,
                'current_section_id' => $section->id,
                'current_school_year_id' => $currentSchoolYear->id,
                'emergency_contact_name' => $request->emergency_contact_name,
                'emergency_contact_phone' => $request->emergency_contact_phone,
                'is_active' => true
            ]);

            // Update section enrollment count
            $section->increment('current_enrollment');

            // If section has an adviser, assign to student
            if ($section->adviser_id) {
                $student->update(['current_adviser_id' => $section->adviser_id]);
            }

            DB::commit();

            // Send email notification if email is provided
            if ($request->email) {
                try {
                    $emailData = [
                        'username' => $user->username,
                        'full_name' => $student->full_name,
                        'student_number' => $student->student_number,
                        'grade_section' => $section->gradeLevel->level_name . ' - ' . $section->section_name,
                        'email' => $request->email,
                        'temp_password' => $tempPassword
                    ];
                    
                    Mail::to($request->email)->send(new UserAccountCreated($emailData));
                } catch (\Exception $e) {
                    // Log email error but don't fail the student creation
                    \Log::warning('Failed to send account creation email: ' . $e->getMessage());
                }
            }

            return $this->sendResponse([
                'student' => [
                    'student_id' => $student->student_id,
                    'student_number' => $student->student_number,
                    'full_name' => $student->full_name,
                    'grade_section' => $section->gradeLevel->level_name . ' - ' . $section->section_name,
                    'username' => $user->username,
                    'temp_password' => $tempPassword
                ]
            ], 'Student created successfully');

        } catch (\Exception $e) {
            DB::rollBack();
            return $this->sendError('Failed to create student', $e->getMessage());
        }
    }

    /**
     * Get all grade levels with their sections (for admin forms)
     */
    public function getGradeLevelsWithSections()
    {
        try {
            $gradeLevels = GradeLevel::with(['sections' => function($query) {
                $query->where('is_active', true)->orderBy('section_name');
            }])
            ->where('is_active', true)
            ->orderBy('level_number')
            ->get()
            ->map(function($gradeLevel) {
                // Map actual grades to admin grade levels
                $adminGradeMapping = [
                    7 => 1, 8 => 2, 9 => 3, 10 => 4, 11 => 5, 12 => 6
                ];
                
                return [
                    'id' => $gradeLevel->id,
                    'level_number' => $gradeLevel->level_number,
                    'level_name' => $gradeLevel->level_name,
                    'admin_grade_level' => $adminGradeMapping[$gradeLevel->level_number] ?? $gradeLevel->level_number,
                    'sections' => $gradeLevel->sections->map(function($section) {
                        return [
                            'id' => $section->id,
                            'section_name' => $section->section_name,
                            'capacity' => $section->capacity,
                            'current_enrollment' => $section->current_enrollment ?? 0
                        ];
                    })
                ];
            });

            return $this->sendResponse($gradeLevels, 'Grade levels with sections retrieved successfully');

        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve grade levels', $e->getMessage());
        }
    }

    /**
     * Get health risk visualization data (BMI statistics by grade level)
     * Uses real data from vitals table
     */
    public function getHealthRiskVisualization(Request $request)
    {
        try {
            // Get BMI data from vitals table with student grade information
            $bmiStats = DB::select("
                SELECT 
                    COALESCE(s.grade_level, 'Unknown') as grade_name,
                    COALESCE(s.grade_level, 'Unknown') as grade_level,
                    COUNT(DISTINCT s.student_id) as total_students,
                    SUM(CASE WHEN v.bmi_category = 'Underweight' THEN 1 ELSE 0 END) as underweight_count,
                    SUM(CASE WHEN v.bmi_category = 'Normal' THEN 1 ELSE 0 END) as normal_count,
                    SUM(CASE WHEN v.bmi_category = 'Overweight' THEN 1 ELSE 0 END) as overweight_count,
                    SUM(CASE WHEN v.bmi_category = 'Obese' THEN 1 ELSE 0 END) as obese_count,
                    AVG(v.bmi) as average_bmi
                FROM students s
                LEFT JOIN medical_visits mv ON s.student_id = mv.student_id
                LEFT JOIN vitals v ON mv.visit_id = v.visit_id AND v.bmi IS NOT NULL
                WHERE s.is_active = 1
                GROUP BY s.grade_level
                HAVING total_students > 0
                ORDER BY s.grade_level
            ");

            // Calculate percentages
            $gradeStatistics = collect($bmiStats)->map(function($grade) {
                $total = (int)$grade->total_students;
                $underweight = (int)$grade->underweight_count;
                $normal = (int)$grade->normal_count;
                $overweight = (int)$grade->overweight_count;
                $obese = (int)$grade->obese_count;
                
                return [
                    'grade_name' => 'Grade ' . $grade->grade_level,
                    'grade_level' => 'Grade ' . $grade->grade_level,
                    'total_students' => $total,
                    'underweight_count' => $underweight,
                    'normal_count' => $normal,
                    'overweight_count' => $overweight,
                    'obese_count' => $obese,
                    'underweight_percentage' => $total > 0 ? round(($underweight / $total) * 100, 1) : 0,
                    'normal_percentage' => $total > 0 ? round(($normal / $total) * 100, 1) : 0,
                    'overweight_percentage' => $total > 0 ? round(($overweight / $total) * 100, 1) : 0,
                    'obese_percentage' => $total > 0 ? round(($obese / $total) * 100, 1) : 0,
                ];
            });

            // If no data, return empty structure
            if ($gradeStatistics->isEmpty()) {
                $gradeStatistics = collect([[
                    'grade_name' => 'No Data',
                    'grade_level' => 'No Data',
                    'total_students' => 0,
                    'underweight_count' => 0,
                    'normal_count' => 0,
                    'overweight_count' => 0,
                    'obese_count' => 0,
                    'underweight_percentage' => 0.0,
                    'normal_percentage' => 0.0,
                    'overweight_percentage' => 0.0,
                    'obese_percentage' => 0.0,
                ]]);
            }

            // Calculate overall statistics
            $totalStudents = $gradeStatistics->sum('total_students');
            $totalUnderweight = $gradeStatistics->sum('underweight_count');
            $totalNormal = $gradeStatistics->sum('normal_count');
            $totalOverweight = $gradeStatistics->sum('overweight_count');
            $totalObese = $gradeStatistics->sum('obese_count');

            $overallStatistics = [
                'total_students' => $totalStudents,
                'total_underweight' => $totalUnderweight,
                'total_normal' => $totalNormal,
                'total_overweight' => $totalOverweight,
                'total_obese' => $totalObese,
                'average_bmi' => $totalStudents > 0 ? round(collect($bmiStats)->avg('average_bmi'), 1) : 0
            ];

            // Get top health risks by grade
            $topRisks = $gradeStatistics->map(function($grade) {
                $risks = [
                    'underweight' => $grade['underweight_percentage'],
                    'overweight' => $grade['overweight_percentage'],
                    'obese' => $grade['obese_percentage']
                ];
                
                $highestRisk = 'normal';
                $highestPercentage = $grade['normal_percentage'];
                
                foreach ($risks as $riskType => $percentage) {
                    if ($percentage > $highestPercentage) {
                        $highestRisk = $riskType;
                        $highestPercentage = $percentage;
                    }
                }
                
                return [
                    'grade_name' => $grade['grade_name'],
                    'grade_level' => $grade['grade_level'],
                    'highest_risk' => $highestRisk,
                    'risk_percentage' => $highestPercentage,
                    'total_students' => $grade['total_students']
                ];
            })->sortByDesc('risk_percentage')->values();

            // Get recent BMI update trends (last 30 days)
            $recentTrends = DB::select("
                SELECT 
                    DATE(v.recorded_at) as update_date,
                    COUNT(*) as updates_count,
                    SUM(CASE WHEN v.bmi_category = 'Overweight' THEN 1 ELSE 0 END) as new_overweight,
                    SUM(CASE WHEN v.bmi_category = 'Obese' THEN 1 ELSE 0 END) as new_obese
                FROM vitals v
                WHERE v.recorded_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                AND v.bmi IS NOT NULL
                GROUP BY DATE(v.recorded_at)
                ORDER BY update_date DESC
                LIMIT 10
            ");

            return $this->sendResponse([
                'grade_statistics' => $gradeStatistics,
                'overall_statistics' => $overallStatistics,
                'top_health_risks' => $topRisks,
                'recent_trends' => $recentTrends,
                'chart_data' => [
                    'labels' => $gradeStatistics->pluck('grade_name')->toArray(),
                    'datasets' => [
                        [
                            'label' => 'Underweight',
                            'data' => $gradeStatistics->pluck('underweight_percentage')->toArray(),
                            'backgroundColor' => '#17a2b8',
                            'borderColor' => '#138496',
                            'borderWidth' => 1
                        ],
                        [
                            'label' => 'Normal Weight',
                            'data' => $gradeStatistics->pluck('normal_percentage')->toArray(),
                            'backgroundColor' => '#28a745',
                            'borderColor' => '#1e7e34',
                            'borderWidth' => 1
                        ],
                        [
                            'label' => 'Overweight',
                            'data' => $gradeStatistics->pluck('overweight_percentage')->toArray(),
                            'backgroundColor' => '#ffc107',
                            'borderColor' => '#e0a800',
                            'borderWidth' => 1
                        ],
                        [
                            'label' => 'Obese',
                            'data' => $gradeStatistics->pluck('obese_percentage')->toArray(),
                            'backgroundColor' => '#dc3545',
                            'borderColor' => '#c82333',
                            'borderWidth' => 1
                        ]
                    ]
                ]
            ], 'Health risk visualization data retrieved successfully');

        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve health risk data', $e->getMessage());
        }
    }

    /**
     * Get system reports
     */
    public function getReports(Request $request)
    {
        try {
            $reportType = $request->get('type', 'summary');
            $startDate = $request->get('start_date', date('Y-m-01'));
            $endDate = $request->get('end_date', date('Y-m-d'));
            
            switch ($reportType) {
                case 'summary':
                    return $this->getSummaryReport();
                case 'users':
                    return $this->getUsersReport();
                case 'medical':
                    return $this->getMedicalReport($startDate, $endDate);
                case 'registration':
                    return $this->getRegistrationReport($startDate, $endDate);
                case 'allergies':
                    return $this->getAllergiesReport();
                default:
                    return $this->sendError('Invalid report type');
            }
            
        } catch (\Exception $e) {
            return $this->sendError('Failed to generate report', $e->getMessage());
        }
    }

    /**
     * Get summary report
     */
    private function getSummaryReport()
    {
        $summary = [
            'total_students' => DB::table('users')
                ->join('roles', 'users.role_id', '=', 'roles.role_id')
                ->where('roles.role_name', 'Student')
                ->count(),
            'total_advisers' => DB::table('users')
                ->join('roles', 'users.role_id', '=', 'roles.role_id')
                ->where('roles.role_name', 'Adviser')
                ->count(),
            'total_staff' => DB::table('users')
                ->join('roles', 'users.role_id', '=', 'roles.role_id')
                ->where('roles.role_name', 'Clinic Staff')
                ->count(),
            'active_users' => DB::table('users')->where('is_active', 1)->count(),
            'inactive_users' => DB::table('users')->where('is_active', 0)->count(),
            'total_visits' => DB::table('medical_visits')->count(),
            'total_allergies' => DB::table('allergies')->count()
        ];
        
        return $this->sendResponse($summary, 'Summary report retrieved successfully');
    }

    /**
     * Get users report
     */
    private function getUsersReport()
    {
        $userStats = DB::table('users')
            ->join('roles', 'users.role_id', '=', 'roles.role_id')
            ->select(
                'roles.role_name as role',
                DB::raw('COUNT(users.user_id) as total'),
                DB::raw('SUM(CASE WHEN users.is_active = 1 THEN 1 ELSE 0 END) as active'),
                DB::raw('SUM(CASE WHEN users.is_active = 0 THEN 1 ELSE 0 END) as inactive')
            )
            ->whereIn('roles.role_name', ['Student', 'Adviser', 'Clinic Staff', 'Admin'])
            ->groupBy('roles.role_name')
            ->get()
            ->map(function($row) {
                return [
                    'role' => $row->role,
                    'total' => (int)$row->total,
                    'active' => (int)$row->active,
                    'inactive' => (int)$row->inactive
                ];
            });
        
        return $this->sendResponse($userStats, 'Users report retrieved successfully');
    }

    /**
     * Get medical report
     */
    private function getMedicalReport($startDate, $endDate)
    {
        $medicalStats = DB::table('medical_visits')
            ->select(
                DB::raw('DATE(visit_datetime) as date'),
                DB::raw('COUNT(*) as total_visits'),
                DB::raw('COUNT(DISTINCT student_id) as unique_students'),
                DB::raw('COUNT(DISTINCT clinic_staff_id) as staff_involved')
            )
            ->whereBetween(DB::raw('DATE(visit_datetime)'), [$startDate, $endDate])
            ->groupBy(DB::raw('DATE(visit_datetime)'))
            ->orderBy('date', 'desc')
            ->get()
            ->map(function($row) {
                return [
                    'date' => $row->date,
                    'total_visits' => (int)$row->total_visits,
                    'unique_students' => (int)$row->unique_students,
                    'staff_involved' => (int)$row->staff_involved
                ];
            });
        
        return $this->sendResponse($medicalStats, 'Medical report retrieved successfully');
    }

    /**
     * Get registration report
     */
    private function getRegistrationReport($startDate, $endDate)
    {
        $registrationStats = DB::table('users')
            ->join('roles', 'users.role_id', '=', 'roles.role_id')
            ->select(
                DB::raw('DATE(users.created_at) as date'),
                'roles.role_name as role',
                DB::raw('COUNT(users.user_id) as count')
            )
            ->whereBetween(DB::raw('DATE(users.created_at)'), [$startDate, $endDate])
            ->groupBy(DB::raw('DATE(users.created_at)'), 'roles.role_name')
            ->orderBy('date', 'desc')
            ->get()
            ->map(function($row) {
                return [
                    'date' => $row->date,
                    'role' => $row->role,
                    'count' => (int)$row->count
                ];
            });
        
        return $this->sendResponse($registrationStats, 'Registration report retrieved successfully');
    }

    /**
     * Get allergies report
     */
    private function getAllergiesReport()
    {
        $allergyStats = DB::table('allergies')
            ->select(
                'allergy_text as allergy',
                'severity',
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('allergy_text', 'severity')
            ->orderBy('count', 'desc')
            ->limit(20)
            ->get()
            ->map(function($row) {
                return [
                    'allergy' => $row->allergy,
                    'severity' => $row->severity,
                    'count' => (int)$row->count
                ];
            });
        
        return $this->sendResponse($allergyStats, 'Allergies report retrieved successfully');
    }

    /**
     * Generate temporary password
     */
    private function generateTempPassword()
    {
        $uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $lowercase = 'abcdefghijklmnopqrstuvwxyz';
        $numbers = '0123456789';
        $symbols = '%#@&*';
        
        $password = '';
        $password .= $uppercase[rand(0, strlen($uppercase) - 1)];
        $password .= $lowercase[rand(0, strlen($lowercase) - 1)];
        $password .= $numbers[rand(0, strlen($numbers) - 1)];
        $password .= $symbols[rand(0, strlen($symbols) - 1)];
        
        $allChars = $uppercase . $lowercase . $numbers;
        for ($i = 0; $i < 4; $i++) {
            $password .= $allChars[rand(0, strlen($allChars) - 1)];
        }
        
        return str_shuffle($password);
    }
}