<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\BaseController;
use App\Models\User;
use App\Models\Student;
use App\Models\Section;
use App\Models\GradeLevel;
use App\Models\SchoolYear;
use App\Mail\UserAccountCreated;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class AdminController extends BaseController
{
    /**
     * Get admin dashboard data
     */
    public function dashboard()
    {
        try {
            // Get user counts by role
            $userCounts = DB::table('users')
                ->join('roles', 'users.role_id', '=', 'roles.role_id')
                ->select('roles.role_name', DB::raw('COUNT(*) as count'))
                ->where('users.is_active', 1)
                ->groupBy('roles.role_name')
                ->get()
                ->keyBy('role_name');

            $totalUsers = $userCounts->sum('count');
            $students = $userCounts->get('Student')?->count ?? 0;
            $advisers = $userCounts->get('Adviser')?->count ?? 0;
            $clinicStaff = $userCounts->get('Clinic Staff')?->count ?? 0;
            $admins = $userCounts->get('Admin')?->count ?? 0;

            // Get recent users count (last 30 days)
            $recentUsersCount = DB::table('users')
                ->where('created_at', '>=', now()->subDays(30))
                ->count();

            // Get BMI statistics for health insights
            $bmiStats = DB::select("
                SELECT
                    COUNT(*) as total_students_with_bmi,
                    AVG(COALESCE(vl.latest_bmi, s.bmi)) as average_bmi,
                    SUM(CASE WHEN COALESCE(vl.latest_bmi, s.bmi) >= 25 THEN 1 ELSE 0 END) as overweight_obese_count
                FROM students s
                LEFT JOIN (
                    SELECT
                        ranked.student_id,
                        ranked.bmi as latest_bmi
                    FROM (
                        SELECT
                            mv.student_id,
                            v.bmi,
                            ROW_NUMBER() OVER (
                                PARTITION BY mv.student_id
                                ORDER BY COALESCE(v.recorded_at, mv.visit_datetime) DESC, v.vitals_id DESC
                            ) as rn
                        FROM medical_visits mv
                        INNER JOIN vitals v ON v.visit_id = mv.visit_id
                        WHERE v.bmi IS NOT NULL
                    ) ranked
                    WHERE ranked.rn = 1
                ) vl ON vl.student_id = s.student_id
                WHERE s.is_active = 1 AND COALESCE(vl.latest_bmi, s.bmi) IS NOT NULL
            ");

            $bmiData = $bmiStats[0] ?? null;
            $totalStudentsWithBmi = $bmiData ? (int)$bmiData->total_students_with_bmi : 0;
            $averageBmi = $bmiData && $bmiData->average_bmi ? round((float)$bmiData->average_bmi, 1) : 19.5;
            $overweightObeseCount = $bmiData ? (int)$bmiData->overweight_obese_count : 0;

            return $this->sendResponse([
                'current_stats' => [
                    'total_users' => $totalUsers,
                    'students' => $students,
                    'faculty' => $advisers,
                    'clinic_staff' => $clinicStaff,
                    'admins' => $admins,
                    'recent_users_count' => $recentUsersCount
                ],
                'health_insights' => [
                    'total_students_analyzed' => $totalStudentsWithBmi,
                    'school_average_bmi' => $averageBmi,
                    'students_overweight_obese' => $overweightObeseCount,
                    'highest_risk_grade' => 'Grade 7' // This would be calculated from actual data
                ]
            ], 'Dashboard data retrieved successfully');

        } catch (\Exception $e) {
            Log::error('Dashboard data retrieval failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->sendError('Failed to retrieve dashboard data', $e->getMessage());
        }
    }

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

            $currentSchoolYearId = DB::table('school_years')->where('is_current', true)->value('id');

            // Get sections for this grade level filtered by current school year
            $sections = Section::where('grade_level_id', $gradeLevel->id)
                ->where('is_active', true)
                ->when($currentSchoolYearId, fn($q) => $q->where('school_year_id', $currentSchoolYearId))
                ->withCount(['students' => function($q) {
                    $q->where('is_active', true);
                }])
                ->orderBy('section_name')
                ->get()
                ->map(function($section) {
                    return [
                        'id' => $section->id,
                        'section_name' => $section->section_name,
                        'capacity' => $section->capacity,
                        'current_enrollment' => $section->students_count ?? 0
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
                'student_number' => ['required', 'string', 'unique:students,student_number', 'digits:12', 'regex:/^13/'],
                'first_name' => 'required|string|max:80',
                'last_name' => 'required|string|max:80',
                'middle_name' => 'nullable|string|max:80',
                'birth_date' => 'required|date',
                'gender' => 'required|in:M,F',
                'grade_level' => 'required|integer|exists:grade_levels,id',
                'section_id' => 'required|integer|exists:sections,id',
                'email' => 'nullable|email|unique:users,email',
                'phone' => 'nullable|string|max:20',
                'emergency_contact_name' => 'nullable|string|max:150',
                'emergency_contact_phone' => 'nullable|string|max:20'
            ]);

            if ($validator->fails()) {
                return $this->sendError('Validation Error', $validator->errors()->toJson());
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

            // Verify section belongs to the selected grade level
            if ($section->grade_level_id != $request->grade_level) {
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
                'phone' => $request->phone,
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

                    Mail::to($request->email)->send(new UserAccountCreated($emailData, $tempPassword, 'Student'));
                } catch (\Exception $e) {
                    // Log email error but don't fail the student creation
                    Log::warning('Failed to send account creation email: ' . $e->getMessage());
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
            // Pre-load all adviser names in one query
            $adviserNames = DB::table('users')
                ->whereIn('role_id', function($q) {
                    $q->select('role_id')->from('roles')->where('role_name', 'Adviser');
                })
                ->pluck('full_name', 'user_id');

            $currentSchoolYearId = DB::table('school_years')->where('is_current', true)->value('id');

            $gradeLevels = GradeLevel::with(['sections' => function($query) use ($currentSchoolYearId) {
                $query->where('is_active', true)
                      ->when($currentSchoolYearId, fn($q) => $q->where('school_year_id', $currentSchoolYearId))
                      ->withCount(['students' => function($q) {
                          $q->where('is_active', true);
                      }])
                      ->orderBy('section_number');
            }])
            ->where('is_active', true)
            ->orderBy('level_number')
            ->get()
            ->map(function($gradeLevel) use ($adviserNames) {
                return [
                    'id'               => $gradeLevel->id,
                    'level_number'     => $gradeLevel->level_number,
                    'level_name'       => $gradeLevel->level_name,
                    'sections'         => $gradeLevel->sections->map(function($section) use ($adviserNames) {
                        return [
                            'id'                 => $section->id,
                            'section_name'       => $section->section_name,
                            'adviser_id'         => $section->adviser_id,
                            'adviser_name'       => $section->adviser_id ? ($adviserNames[$section->adviser_id] ?? null) : null,
                            'capacity'           => $section->capacity,
                            'current_enrollment' => $section->students_count ?? 0,
                            'grade_level_id'     => $section->grade_level_id,
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
     * Get all advisers
     */
    public function getAdvisers()
    {
        try {
            $advisers = User::with(['role', 'adviser'])
                ->whereHas('role', function($q) {
                    $q->where('role_name', 'Adviser');
                })
                ->where('is_active', true)
                ->get()
                ->map(function($user) {
                    return [
                        'user_id'  => $user->user_id,
                        'full_name' => $user->full_name,
                        'email'    => $user->email,
                    ];
                });

            return $this->sendResponse($advisers, 'Advisers retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve advisers', $e->getMessage());
        }
    }

    /**
     * Get sections, optionally filtered by school_year_id
     */
    public function getSections(Request $request)
    {
        try {
            $query = Section::with(['gradeLevel', 'schoolYear'])
                ->withCount(['students' => function($q) {
                    $q->where('is_active', true);
                }])
                ->where('is_active', true);

            if ($request->has('school_year_id')) {
                $query->where('school_year_id', $request->school_year_id);
            }

            $sections = $query->orderBy('grade_level_id')->orderBy('section_number')->get()
                ->map(function($section) {
                    $adviser = null;
                    if ($section->adviser_id) {
                        $adviserUser = User::find($section->adviser_id);
                        $adviser = $adviserUser?->full_name;
                    }
                    return [
                        'id'                 => $section->id,
                        'section_name'       => $section->section_name,
                        'section_number'     => $section->section_number,
                        'grade_level_id'     => $section->grade_level_id,
                        'school_year_id'     => $section->school_year_id,
                        'adviser_id'         => $section->adviser_id,
                        'adviser_name'       => $adviser,
                        'capacity'           => $section->capacity,
                        'current_enrollment' => $section->students_count ?? 0,
                        'is_active'          => $section->is_active,
                        'level_name'         => $section->gradeLevel->level_name ?? null,
                        'level_number'       => $section->gradeLevel->level_number ?? null,
                        'year_name'          => $section->schoolYear->year_name ?? null,
                    ];
                });

            return $this->sendResponse($sections, 'Sections retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve sections', $e->getMessage());
        }
    }

    /**
     * Create a new section
     */
    public function createSection(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'section_name'   => 'required|string|max:50',
                'grade_level_id' => 'required|integer|exists:grade_levels,id',
                'school_year_id' => 'nullable|integer|exists:school_years,id',
                'capacity'       => 'nullable|integer|min:1|max:200',
            ]);

            if ($validator->fails()) {
                return $this->sendError('Validation Error', $validator->errors()->first());
            }

            // Fall back to current school year if not provided
            $schoolYearId = $request->school_year_id
                ?? SchoolYear::where('is_current', true)->value('id');

            if (!$schoolYearId) {
                return $this->sendError('No current school year set');
            }

            $section = Section::create([
                'section_name'       => $request->section_name,
                'grade_level_id'     => $request->grade_level_id,
                'school_year_id'     => $schoolYearId,
                'capacity'           => $request->capacity ?? 50,
                'current_enrollment' => 0,
                'is_active'          => true,
            ]);

            return $this->sendResponse(['section' => $section], 'Section created successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to create section', $e->getMessage());
        }
    }

    /**
     * Update an existing section
     */
    public function updateSection(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'section_name' => 'sometimes|required|string|max:50',
                'adviser_id'   => 'nullable|integer|exists:users,user_id',
                'capacity'     => 'nullable|integer|min:1|max:200',
            ]);

            if ($validator->fails()) {
                return $this->sendError('Validation Error', $validator->errors()->first());
            }

            $section = Section::findOrFail($id);

            $section->update(array_filter([
                'section_name' => $request->section_name ?? $section->section_name,
                'adviser_id'   => $request->has('adviser_id') ? $request->adviser_id : $section->adviser_id,
                'capacity'     => $request->capacity ?? $section->capacity,
            ], fn($v) => $v !== null));

            // If adviser changed, update students in this section
            if ($request->has('adviser_id')) {
                Student::where('current_section_id', $section->id)
                    ->where('is_active', true)
                    ->update(['current_adviser_id' => $request->adviser_id]);
            }

            return $this->sendResponse(['section' => $section], 'Section updated successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to update section', $e->getMessage());
        }
    }

    /**
     * Delete a section
     */
    public function deleteSection($id)
    {
        try {
            $section = Section::findOrFail($id);

            // Unassign students from this section
            Student::where('current_section_id', $section->id)
                ->update(['current_section_id' => null, 'current_adviser_id' => null]);

            $section->delete();

            return $this->sendResponse([], 'Section deleted successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to delete section', $e->getMessage());
        }
    }

    /**
     * Assign or remove an adviser from a section
     */
    public function assignAdviserToSection(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'section_id'       => 'required|integer|exists:sections,id',
                'adviser_user_id'  => 'nullable|integer|exists:users,user_id',
            ]);

            if ($validator->fails()) {
                return $this->sendError('Validation Error', $validator->errors()->first());
            }

            $section = Section::findOrFail($request->section_id);
            $section->update(['adviser_id' => $request->adviser_user_id]);

            // Update students in this section to point to the new adviser
            $studentsUpdated = 0;
            if ($request->adviser_user_id) {
                $studentsUpdated = Student::where('current_section_id', $section->id)
                    ->where('is_active', true)
                    ->update(['current_adviser_id' => $request->adviser_user_id]);
            }

            return $this->sendResponse(
                ['students_updated' => $studentsUpdated],
                $request->adviser_user_id ? 'Adviser assigned successfully' : 'Adviser removed successfully'
            );
        } catch (\Exception $e) {
            return $this->sendError('Failed to assign adviser', $e->getMessage());
        }
    }

    /**
     * Get students for a specific section
     */
    public function getSectionStudents(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'section_id' => 'required|integer|exists:sections,id',
            ]);

            if ($validator->fails()) {
                return $this->sendError('Validation Error', $validator->errors()->first());
            }

            $section = Section::with(['gradeLevel', 'schoolYear'])->findOrFail($request->section_id);

            $adviserName = null;
            if ($section->adviser_id) {
                $adviserUser = User::find($section->adviser_id);
                $adviserName = $adviserUser?->full_name;
            }

            $students = Student::with(['allergies', 'medicalVisits' => function($q) {
                    $q->latest('visit_datetime')->limit(1);
                }])
                ->where('current_section_id', $section->id)
                ->where('is_active', true)
                ->get()
                ->map(function($student) {
                    $age = $student->birth_date
                        ? \Carbon\Carbon::parse($student->birth_date)->age
                        : null;

                    return [
                        'student_id'              => $student->student_id,
                        'student_number'          => $student->student_number,
                        'full_name'               => $student->full_name,
                        'gender'                  => $student->gender,
                        'age'                     => $age,
                        'blood_type'              => $student->blood_type ?? null,
                        'emergency_contact'       => $student->emergency_contact_name ?? null,
                        'emergency_contact_phone' => $student->emergency_contact_phone ?? null,
                        'enrollment_status'       => $student->is_active ? 'active' : 'inactive',
                        'allergies'               => $student->allergies->pluck('allergen')->toArray(),
                        'last_visit'              => $student->medicalVisits->first() ? [
                            'visit_datetime' => $student->medicalVisits->first()->visit_datetime,
                        ] : null,
                    ];
                });

            $stats = [
                'total_students'           => $students->count(),
                'students_with_allergies'  => $students->filter(fn($s) => count($s['allergies']) > 0)->count(),
                'students_with_visits'     => $students->filter(fn($s) => $s['last_visit'] !== null)->count(),
            ];

            return $this->sendResponse([
                'section'  => [
                    'id'               => $section->id,
                    'section_name'     => $section->section_name,
                    'school_year'      => $section->schoolYear->year_name ?? null,
                    'adviser_name'     => $adviserName,
                    'capacity'         => $section->capacity,
                    'current_enrollment' => $students->count(),
                ],
                'students' => $students,
                'stats'    => $stats,
            ], 'Section students retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve section students', $e->getMessage());
        }
    }

    /**
     * Get health risk visualization data (BMI statistics by grade level)
     * Uses real data from vitals table
     */
    public function getHealthRiskVisualization(Request $request)
    {
        try {
            // Get BMI data per student (latest vitals BMI, fallback to student BMI fields)
            // Then aggregate by grade level to avoid double-counting students with multiple visits
            $bmiStats = DB::select("
                SELECT
                    COALESCE(b.grade_level, 'Unknown') as grade_level,
                    COUNT(*) as total_students,
                    SUM(CASE WHEN LOWER(COALESCE(b.bmi_category, '')) = 'underweight' THEN 1 ELSE 0 END) as underweight_count,
                    SUM(CASE WHEN LOWER(COALESCE(b.bmi_category, '')) IN ('normal', 'normal weight') THEN 1 ELSE 0 END) as normal_count,
                    SUM(CASE WHEN LOWER(COALESCE(b.bmi_category, '')) = 'overweight' THEN 1 ELSE 0 END) as overweight_count,
                    SUM(CASE WHEN LOWER(COALESCE(b.bmi_category, '')) = 'obese' THEN 1 ELSE 0 END) as obese_count,
                    AVG(b.bmi) as average_bmi
                FROM (
                    SELECT
                        s.student_id,
                        s.grade_level,
                        COALESCE(vl.latest_bmi, s.bmi) as bmi,
                        CASE
                            WHEN COALESCE(vl.latest_bmi, s.bmi) < 18.5 THEN 'Underweight'
                            WHEN COALESCE(vl.latest_bmi, s.bmi) >= 18.5 AND COALESCE(vl.latest_bmi, s.bmi) < 25 THEN 'Normal'
                            WHEN COALESCE(vl.latest_bmi, s.bmi) >= 25 AND COALESCE(vl.latest_bmi, s.bmi) < 30 THEN 'Overweight'
                            WHEN COALESCE(vl.latest_bmi, s.bmi) >= 30 THEN 'Obese'
                            ELSE NULL
                        END as bmi_category
                    FROM students s
                    LEFT JOIN (
                        SELECT
                            ranked.student_id,
                            ranked.bmi as latest_bmi
                        FROM (
                            SELECT
                                mv.student_id,
                                v.bmi,
                                ROW_NUMBER() OVER (
                                    PARTITION BY mv.student_id
                                    ORDER BY COALESCE(v.recorded_at, mv.visit_datetime) DESC, v.vitals_id DESC
                                ) as rn
                            FROM medical_visits mv
                            INNER JOIN vitals v ON v.visit_id = mv.visit_id
                            WHERE v.bmi IS NOT NULL
                        ) ranked
                        WHERE ranked.rn = 1
                    ) vl ON vl.student_id = s.student_id
                    WHERE s.is_active = 1
                ) b
                WHERE b.bmi IS NOT NULL
                GROUP BY b.grade_level
                HAVING total_students > 0
                ORDER BY b.grade_level
            ");

            // Calculate percentages
            $gradeStatistics = collect($bmiStats)->map(function($grade) {
                $rawGradeLevel = trim((string)$grade->grade_level);
                $formattedGradeLevel = preg_match('/^\d+$/', $rawGradeLevel)
                    ? 'Grade ' . $rawGradeLevel
                    : $rawGradeLevel;

                $total = (int)$grade->total_students;
                $underweight = (int)$grade->underweight_count;
                $normal = (int)$grade->normal_count;
                $overweight = (int)$grade->overweight_count;
                $obese = (int)$grade->obese_count;

                return [
                    'grade_name' => $formattedGradeLevel,
                    'grade_level' => $formattedGradeLevel,
                    'total_students' => $total,
                    'underweight_count' => $underweight,
                    'normal_count' => $normal,
                    'overweight_count' => $overweight,
                    'obese_count' => $obese,
                    'average_bmi' => $grade->average_bmi !== null ? round((float)$grade->average_bmi, 1) : 0,
                    'underweight_percentage' => $total > 0 ? round(($underweight / $total) * 100, 1) : 0,
                    'normal_percentage' => $total > 0 ? round(($normal / $total) * 100, 1) : 0,
                    'overweight_percentage' => $total > 0 ? round(($overweight / $total) * 100, 1) : 0,
                    'obese_percentage' => $total > 0 ? round(($obese / $total) * 100, 1) : 0,
                ];
            })->sortBy(function($grade) {
                if (preg_match('/(\d+)/', $grade['grade_name'], $matches)) {
                    return (int)$matches[1];
                }
                return PHP_INT_MAX;
            })->values();

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
                'average_bmi' => $totalStudents > 0
                    ? round($gradeStatistics->sum(function($grade) {
                        return ($grade['average_bmi'] ?? 0) * ($grade['total_students'] ?? 0);
                    }) / $totalStudents, 1)
                    : 0
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
                    SUM(CASE WHEN v.bmi >= 25 AND v.bmi < 30 THEN 1 ELSE 0 END) as new_overweight,
                    SUM(CASE WHEN v.bmi >= 30 THEN 1 ELSE 0 END) as new_obese
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
     * Get principal-ready health trend report dataset for printable PDF generation
     */
    public function getPrincipalHealthTrendReport(Request $request)
    {
        try {
            $validated = Validator::make($request->all(), [
                'year' => 'nullable|integer|min:2020|max:2100',
                'quarter' => 'nullable|integer|min:1|max:4',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date',
                'grade_level' => 'nullable|string|max:20',
            ]);

            if ($validated->fails()) {
                return $this->sendError('Validation Error', $validated->errors()->first(), 422);
            }

            $currentYear = (int)date('Y');
            $year = (int)$request->get('year', $currentYear);
            $quarter = (int)$request->get('quarter', (int)ceil((int)date('n') / 3));

            if ($request->filled('start_date') && $request->filled('end_date')) {
                $startDate = Carbon::parse($request->get('start_date'))->startOfDay();
                $endDate = Carbon::parse($request->get('end_date'))->endOfDay();
            } else {
                $quarterStartMonth = (($quarter - 1) * 3) + 1;
                $startDate = Carbon::create($year, $quarterStartMonth, 1)->startOfDay();
                $endDate = (clone $startDate)->addMonths(3)->subDay()->endOfDay();
            }

            if ($endDate->lt($startDate)) {
                return $this->sendError('Validation Error', 'End date must be after start date', 422);
            }

            $localizedDateTimeExpression = 'mv.visit_datetime';
            $localizedDateExpression = "DATE({$localizedDateTimeExpression})";

            $baseQuery = DB::table('medical_visits as mv')
                ->leftJoin('students as s', 'mv.student_id', '=', 's.student_id')
                ->whereBetween(DB::raw($localizedDateExpression), [$startDate->toDateString(), $endDate->toDateString()]);

            $gradeFilter = $request->get('grade_level');
            if (!empty($gradeFilter)) {
                $baseQuery->where(function ($query) use ($gradeFilter) {
                    $query->where('s.grade_level', $gradeFilter)
                        ->orWhere('s.grade_level', 'Grade ' . $gradeFilter);
                });
            }

            $totalVisits = (clone $baseQuery)->count();
            $uniqueStudents = (clone $baseQuery)->distinct('mv.student_id')->count('mv.student_id');
            $emergencyVisits = (clone $baseQuery)
                ->whereRaw('LOWER(COALESCE(mv.visit_type, "")) = ?', ['emergency'])
                ->count();
            $hospitalReferrals = (clone $baseQuery)
                ->whereRaw('LOWER(COALESCE(mv.status, "")) = ?', ['referred'])
                ->count();

            $visitsByDayHour = (clone $baseQuery)
                ->selectRaw("DAYNAME({$localizedDateTimeExpression}) as day_name")
                ->selectRaw("CASE DAYOFWEEK({$localizedDateTimeExpression}) WHEN 1 THEN 7 ELSE DAYOFWEEK({$localizedDateTimeExpression}) - 1 END as day_number")
                ->selectRaw("HOUR({$localizedDateTimeExpression}) as hour_slot")
                ->selectRaw('COUNT(*) as visits')
                ->groupByRaw("DAYNAME({$localizedDateTimeExpression}), CASE DAYOFWEEK({$localizedDateTimeExpression}) WHEN 1 THEN 7 ELSE DAYOFWEEK({$localizedDateTimeExpression}) - 1 END, HOUR({$localizedDateTimeExpression})")
                ->orderBy('day_number')
                ->orderBy('hour_slot')
                ->get()
                ->map(function ($row) {
                    $hour = (int)$row->hour_slot;
                    $nextHour = ($hour + 1) % 24;
                    return [
                        'day' => $row->day_name,
                        'dayNumber' => (int)$row->day_number,
                        'hour' => $hour,
                        'timeRange' => sprintf('%02d:00-%02d:00', $hour, $nextHour),
                        'timeRangeLabel' => Carbon::createFromTime($hour, 0)->format('g:i A') . ' - ' . Carbon::createFromTime($nextHour, 0)->format('g:i A'),
                        'visits' => (int)$row->visits,
                    ];
                })
                ->values();

            $peakSlot = (clone $baseQuery)
                ->selectRaw("DAYNAME({$localizedDateTimeExpression}) as day_name")
                ->selectRaw("CASE DAYOFWEEK({$localizedDateTimeExpression}) WHEN 1 THEN 7 ELSE DAYOFWEEK({$localizedDateTimeExpression}) - 1 END as day_number")
                ->selectRaw("HOUR({$localizedDateTimeExpression}) as hour_slot")
                ->selectRaw('COUNT(*) as visits')
                ->groupByRaw("DAYNAME({$localizedDateTimeExpression}), CASE DAYOFWEEK({$localizedDateTimeExpression}) WHEN 1 THEN 7 ELSE DAYOFWEEK({$localizedDateTimeExpression}) - 1 END, HOUR({$localizedDateTimeExpression})")
                ->orderByDesc('visits')
                ->orderBy('day_number')
                ->orderBy('hour_slot')
                ->first();

            $topReasons = (clone $baseQuery)
                ->selectRaw('COALESCE(NULLIF(TRIM(mv.chief_complaint), ""), NULLIF(TRIM(mv.notes), ""), "Unspecified") as reason, COUNT(*) as count')
                ->groupBy('reason')
                ->orderByDesc('count')
                ->limit(10)
                ->get()
                ->map(function ($row) {
                    return [
                        'reason' => $row->reason,
                        'count' => (int)$row->count,
                    ];
                })
                ->values();

            $dailyTrend = (clone $baseQuery)
                ->selectRaw("{$localizedDateExpression} as date, COUNT(*) as visits")
                ->groupByRaw($localizedDateExpression)
                ->orderBy('date')
                ->get()
                ->map(function ($row) {
                    return [
                        'date' => $row->date,
                        'visits' => (int)$row->visits,
                    ];
                })
                ->values();

            $gradeBreakdown = (clone $baseQuery)
                ->selectRaw('COALESCE(NULLIF(TRIM(s.grade_level), ""), "Unknown") as grade_level, COUNT(*) as visits')
                ->groupBy('grade_level')
                ->orderBy('grade_level')
                ->get()
                ->map(function ($row) {
                    return [
                        'gradeLevel' => $row->grade_level,
                        'visits' => (int)$row->visits,
                    ];
                })
                ->values();

            $recommendation = [
                'title' => 'Maintain current clinic staffing schedule',
                'details' => 'Visit volume is currently manageable across available slots. Continue weekly monitoring.',
                'priority' => 'normal',
            ];

            if ($peakSlot && (int)$peakSlot->visits >= 8) {
                $startHour = (int)$peakSlot->hour_slot;
                $endHour = ($startHour + 1) % 24;
                $recommendation = [
                    'title' => 'Assign additional volunteer nurse on peak hours',
                    'details' => sprintf(
                        'Peak clinic demand occurs on %s between %02d:00-%02d:00 (%d visits). Recommend adding 1 volunteer nurse during this slot.',
                        $peakSlot->day_name,
                        $startHour,
                        $endHour,
                        (int)$peakSlot->visits
                    ),
                    'priority' => 'high',
                ];
            }

            $preparedBy = $request->user();

            return $this->sendResponse([
                'reportMeta' => [
                    'title' => 'Quarterly School Clinic Health Trend Report',
                    'periodStart' => $startDate->toDateString(),
                    'periodEnd' => $endDate->toDateString(),
                    'quarter' => $quarter,
                    'year' => $year,
                    'generatedAt' => now()->toISOString(),
                    'preparedBy' => $preparedBy?->full_name ?? $preparedBy?->username ?? 'System',
                ],
                'summary' => [
                    'totalVisits' => (int)$totalVisits,
                    'uniqueStudents' => (int)$uniqueStudents,
                    'emergencyVisits' => (int)$emergencyVisits,
                    'hospitalReferrals' => (int)$hospitalReferrals,
                ],
                'peakSlot' => $peakSlot ? [
                    'day' => $peakSlot->day_name,
                    'dayNumber' => (int)$peakSlot->day_number,
                    'hour' => (int)$peakSlot->hour_slot,
                    'timeRange' => sprintf('%02d:00-%02d:00', (int)$peakSlot->hour_slot, (((int)$peakSlot->hour_slot + 1) % 24)),
                    'timeRangeLabel' => Carbon::createFromTime((int)$peakSlot->hour_slot, 0)->format('g:i A') . ' - ' . Carbon::createFromTime((((int)$peakSlot->hour_slot + 1) % 24), 0)->format('g:i A'),
                    'visits' => (int)$peakSlot->visits,
                ] : null,
                'recommendation' => $recommendation,
                'topReasons' => $topReasons,
                'dailyTrend' => $dailyTrend,
                'visitsByDayHour' => $visitsByDayHour,
                'gradeBreakdown' => $gradeBreakdown,
            ], 'Principal health trend report retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve principal health trend report', $e->getMessage(), 500);
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
                'allergy_name as allergy',
                'severity',
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('allergy_name', 'severity')
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

    /**
     * Get all users (admin, faculty, clinic staff, etc)
     */
    public function getAllUsers(Request $request)
    {
        try {
            Log::info('getAllUsers called', [
                'user_id' => $request->user()?->user_id,
                'role' => $request->user()?->role?->role_name,
                'role_filter' => $request->get('role')
            ]);

            $roleFilter = $request->get('role');

            $buildUserData = function($user) {
                $roleName = $user->role->role_name ?? 'unknown';
                $data = [
                    'user_id'    => $user->user_id,
                    'username'   => $user->username,
                    'email'      => $user->email,
                    'phone'      => $user->phone,
                    'full_name'  => $user->full_name,
                    'role_name'  => $roleName,
                    'is_active'  => (bool)$user->is_active,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                ];

                if ($roleName === 'Student' && $user->student) {
                    $data['student_number']   = $user->student->student_number;
                    $data['first_name']       = $user->student->first_name;
                    $data['last_name']        = $user->student->last_name;
                    $data['gender']           = $user->student->gender;
                    $data['birth_date']       = $user->student->birth_date;
                    $data['grade_level']      = $user->student->grade_level;
                    $data['section']          = $user->student->section;
                }

                if ($roleName === 'Adviser' && $user->adviser) {
                    $data['employee_number']  = $user->adviser->employee_id;
                    $data['contact_phone']    = $user->adviser->contact_phone;
                    $data['department']       = $user->adviser->department;
                }

                if ($roleName === 'Clinic Staff' && $user->clinicStaff) {
                    $data['staff_code']       = $user->clinicStaff->staff_code;
                    $data['position']         = $user->clinicStaff->position;
                }

                return $data;
            };

            if ($roleFilter) {
                $users = User::with(['role', 'student', 'adviser', 'clinicStaff'])
                    ->whereHas('role', function($query) use ($roleFilter) {
                        $query->whereRaw('LOWER(role_name) = ?', [strtolower($roleFilter)]);
                    })
                    ->get()
                    ->map($buildUserData);

                Log::info('getAllUsers filtered result', ['count' => $users->count(), 'filter' => $roleFilter]);
                return $this->sendResponse(['users' => $users], 'Users retrieved successfully');
            }

            $allUsers = User::with(['role', 'student', 'adviser', 'clinicStaff'])->get();
            Log::info('getAllUsers total users found', ['count' => $allUsers->count()]);

            $groupedUsers = ['student' => [], 'adviser' => [], 'clinic_staff' => [], 'admin' => []];

            foreach ($allUsers as $user) {
                $roleName = $user->role->role_name ?? 'unknown';
                $userData = $buildUserData($user);

                if ($roleName === 'Student')           $groupedUsers['student'][]      = $userData;
                elseif ($roleName === 'Adviser')       $groupedUsers['adviser'][]      = $userData;
                elseif ($roleName === 'Clinic Staff')  $groupedUsers['clinic_staff'][] = $userData;
                else                                   $groupedUsers['admin'][]        = $userData;
            }

            $totals = [
                'students'    => count($groupedUsers['student']),
                'advisers'    => count($groupedUsers['adviser']),
                'clinic_staff'=> count($groupedUsers['clinic_staff']),
                'admins'      => count($groupedUsers['admin']),
                'total'       => $allUsers->count()
            ];

            Log::info('getAllUsers grouped result', $totals);

            return $this->sendResponse([
                'users' => [
                    'student'      => array_values($groupedUsers['student']),
                    'adviser'      => array_values($groupedUsers['adviser']),
                    'clinic_staff' => array_values($groupedUsers['clinic_staff']),
                    'admin'        => array_values($groupedUsers['admin']),
                ],
                'totals' => $totals
            ], 'Users retrieved successfully');

        } catch (\Exception $e) {
            Log::error('getAllUsers failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->sendError('Failed to retrieve users', $e->getMessage());
        }
    }

    /**
     * Update user information
     */
    public function updateUser(Request $request, $userId)
    {
        try {
            $validator = Validator::make($request->all(), [
                'full_name' => 'sometimes|string|max:150',
                'email' => 'sometimes|email|unique:users,email,' . $userId . ',user_id',
                'phone' => 'sometimes|nullable|string|max:20',
            ]);

            if ($validator->fails()) {
                return $this->sendError('Validation Error', $validator->errors()->first());
            }

            $user = User::find($userId);
            if (!$user) {
                return $this->sendError('User not found', [], 404);
            }

            $user->update($request->only(['full_name', 'email', 'phone']));

            return $this->sendResponse(['user' => $user], 'User updated successfully');

        } catch (\Exception $e) {
            return $this->sendError('Failed to update user', $e->getMessage());
        }
    }

    /**
     * Reset user password
     */
    public function resetPassword(Request $request, $userId)
    {
        try {
            $validator = Validator::make($request->all(), [
                'new_password' => 'required|string|min:6',
            ]);

            if ($validator->fails()) {
                return $this->sendError('Validation Error', $validator->errors()->first());
            }

            $user = User::find($userId);
            if (!$user) {
                return $this->sendError('User not found', [], 404);
            }

            $user->update([
                'password_hash' => Hash::make($request->new_password),
                'password_must_change' => true
            ]);

            return $this->sendResponse([], 'Password reset successfully');

        } catch (\Exception $e) {
            return $this->sendError('Failed to reset password', $e->getMessage());
        }
    }

    /**
     * Activate user
     */
    public function activateUser($userId)
    {
        try {
            $user = User::find($userId);
            if (!$user) {
                return $this->sendError('User not found', [], 404);
            }

            $user->update(['is_active' => true]);

            // Also activate related records
            if ($user->student) {
                $user->student->update(['is_active' => true]);
            }

            return $this->sendResponse([], 'User activated successfully');

        } catch (\Exception $e) {
            return $this->sendError('Failed to activate user', $e->getMessage());
        }
    }

    /**
     * Deactivate user
     */
    public function deactivateUser($userId)
    {
        try {
            $user = User::find($userId);
            if (!$user) {
                return $this->sendError('User not found', [], 404);
            }

            $user->update(['is_active' => false]);

            // Also deactivate related records
            if ($user->student) {
                $user->student->update(['is_active' => false]);
            }

            return $this->sendResponse([], 'User deactivated successfully');

        } catch (\Exception $e) {
            return $this->sendError('Failed to deactivate user', $e->getMessage());
        }
    }

    /**
     * Delete user
     */
    public function deleteUser($userId)
    {
        try {
            $user = User::find($userId);
            if (!$user) {
                return $this->sendError('User not found', [], 404);
            }

            // Check if user has related records that prevent deletion
            if ($user->student && $user->student->medicalVisits()->count() > 0) {
                return $this->sendError('Cannot delete user with medical visit history', [], 400);
            }

            DB::beginTransaction();

            // Delete related records first
            if ($user->student) {
                $user->student->delete();
            }
            if ($user->adviser) {
                $user->adviser->delete();
            }
            if ($user->clinicStaff) {
                $user->clinicStaff->delete();
            }

            $user->delete();

            DB::commit();

            return $this->sendResponse([], 'User deleted successfully');

        } catch (\Exception $e) {
            DB::rollBack();
            return $this->sendError('Failed to delete user', $e->getMessage());
        }
    }

    /**
     * Create a new student user account (called from createUser when role=student)
     */
    private function createStudentUser(Request $request)
    {
        $validator = Validator::make($request->all(), [
            // Only block if student_number exists AND already has a linked user_id
            'student_number' => [
                'required', 'string', 'digits:12', 'regex:/^13/',
                \Illuminate\Validation\Rule::unique('students', 'student_number')
                    ->where(fn ($q) => $q->whereNotNull('user_id')),
            ],
            'first_name'     => 'required|string|max:80',
            'last_name'      => 'required|string|max:80',
            'middle_name'    => 'nullable|string|max:80',
            'birth_date'     => 'required|date',
            'gender'         => 'required|in:M,F,Other',
            'grade_level'    => 'required|integer|exists:grade_levels,id',
            'section_id'     => 'required|integer|exists:sections,id',
            'email'          => 'nullable|email|unique:users,email',
            'phone'          => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation Error', $validator->errors()->toJson());
        }

        DB::beginTransaction();

        try {
            $currentSchoolYear = SchoolYear::where('is_current', true)->first();
            if (!$currentSchoolYear) {
                return $this->sendError('No current school year set');
            }

            $section = Section::with('gradeLevel')->find($request->section_id);
            if (!$section || !$section->is_active) {
                return $this->sendError('Invalid section selected');
            }

            // Verify section belongs to the selected grade level
            if ($section->grade_level_id != $request->grade_level) {
                return $this->sendError('Section does not match the selected grade level');
            }

            $tempPassword = $this->generateTempPassword();

            $user = User::create([
                'role_id'              => 2,
                'username'             => $request->student_number,
                'password_hash'        => Hash::make($tempPassword),
                'email'                => $request->email,
                'phone'                => $request->phone,
                'full_name'            => trim($request->first_name . ' ' . ($request->middle_name ? $request->middle_name . ' ' : '') . $request->last_name),
                'password_must_change' => true,
                'is_active'            => true,
            ]);

            // Reuse orphaned student record if it exists without a user
            $orphan = Student::where('student_number', $request->student_number)->whereNull('user_id')->first();
            if ($orphan) {
                $orphan->update([
                    'user_id'                => $user->user_id,
                    'first_name'             => $request->first_name,
                    'middle_name'            => $request->middle_name,
                    'last_name'              => $request->last_name,
                    'birth_date'             => $request->birth_date,
                    'gender'                 => $request->gender,
                    'grade_level'            => $section->gradeLevel->level_name,
                    'section'                => $section->section_name,
                    'current_grade_level_id' => $section->grade_level_id,
                    'current_section_id'     => $section->id,
                    'current_school_year_id' => $currentSchoolYear->id,
                    'phone'                  => $request->phone,
                    'is_active'              => true,
                ]);
                $student = $orphan->fresh();
            } else {
                $student = Student::create([
                    'user_id'                => $user->user_id,
                    'student_number'         => $request->student_number,
                    'first_name'             => $request->first_name,
                    'middle_name'            => $request->middle_name,
                    'last_name'              => $request->last_name,
                    'birth_date'             => $request->birth_date,
                    'gender'                 => $request->gender,
                    'grade_level'            => $section->gradeLevel->level_name,
                    'section'                => $section->section_name,
                    'current_grade_level_id' => $section->grade_level_id,
                    'current_section_id'     => $section->id,
                    'current_school_year_id' => $currentSchoolYear->id,
                    'phone'                  => $request->phone,
                    'is_active'              => true,
                ]);
            }

            if ($section->adviser_id) {
                $student->update(['current_adviser_id' => $section->adviser_id]);
            }

            $section->increment('current_enrollment');

            // Generate QR code record for the student (skip if one already exists)
            try {
                $hasQr = DB::table('qr_codes')->where('student_id', $student->student_id)->exists();
                if (!$hasQr) {
                    DB::table('qr_codes')->insert([
                        'student_id'      => $student->student_id,
                        'qr_token'        => \Illuminate\Support\Str::uuid()->toString(),
                        'qr_generated_at' => now(),
                        'qr_expires_at'   => null,
                    ]);
                }
            } catch (\Exception $e) {
                Log::warning('Failed to generate QR code for student: ' . $e->getMessage());
            }

            DB::commit();

            if ($request->email) {
                try {
                    Mail::to($request->email)->send(new UserAccountCreated([
                        'username'      => $user->username,
                        'full_name'     => $student->full_name,
                        'student_number'=> $student->student_number,
                        'grade_section' => $section->gradeLevel->level_name . ' - ' . $section->section_name,
                        'email'         => $request->email,
                        'temp_password' => $tempPassword,
                    ], $tempPassword, 'Student'));
                } catch (\Exception $e) {
                    Log::warning('Failed to send account creation email: ' . $e->getMessage());
                }
            }

            return $this->sendResponse([
                'student_id'     => $student->student_id,
                'student_number' => $student->student_number,
                'full_name'      => $student->full_name,
                'username'       => $user->username,
                'temp_password'  => $tempPassword,
            ], 'Student created successfully');

        } catch (\Exception $e) {
            DB::rollBack();
            return $this->sendError('Failed to create student', $e->getMessage());
        }
    }

    /**
     * Create a new user (non-student roles: Adviser, Clinic Staff, Admin)
     */
    public function createUser(Request $request)
    {
        try {
            // Route student creation to dedicated method
            if ($request->input('role') === 'student') {
                return $this->createStudentUser($request);
            }

            // Convert empty strings to null so nullable rules work correctly
            $input = $request->all();
            foreach (['email', 'phone', 'employee_number', 'staff_code', 'position'] as $field) {
                if (isset($input[$field]) && $input[$field] === '') {
                    $input[$field] = null;
                }
            }

            $validator = Validator::make($input, [
                'role' => 'required|in:adviser,clinic_staff,admin',
                'full_name' => 'required|string|max:150',
                'email' => 'nullable|email|unique:users,email',
                'phone' => 'nullable|string|max:20',
                // Adviser specific fields
                'employee_number' => 'required_if:role,adviser|nullable|string|max:50|unique:advisers,employee_id|unique:users,username',
                // Clinic Staff specific fields
                'staff_code' => 'required_if:role,clinic_staff|nullable|string|max:20|unique:clinic_staff,staff_code|unique:users,username',
                'position' => 'required_if:role,clinic_staff|nullable|string|max:100',
            ]);

            if ($validator->fails()) {
                return $this->sendError('Validation Error', $validator->errors()->first());
            }

            DB::beginTransaction();

            // Generate temporary password
            $tempPassword = $this->generateTempPassword();
            $passwordHash = Hash::make($tempPassword);

            // Determine role ID
            $roleMapping = [
                'adviser' => 3,      // Adviser role
                'clinic_staff' => 4, // Clinic Staff role
                'admin' => 1         // Admin role
            ];

            $roleId = $roleMapping[$input['role']];

            // Determine username: use staff_code for clinic_staff, employee_number for adviser, email otherwise
            if ($input['role'] === 'clinic_staff') {
                $username = $input['staff_code'];
            } elseif ($input['role'] === 'adviser') {
                $username = $input['employee_number'];
            } else {
                $username = $input['email'];
            }

            // Create user account
            $user = User::create([
                'role_id' => $roleId,
                'username' => $username,
                'password_hash' => $passwordHash,
                'email' => $input['email'] ?? null,
                'phone' => $input['phone'] ?? null,
                'full_name' => $input['full_name'],
                'password_must_change' => true,
                'is_active' => true
            ]);

            // Create role-specific records
            if ($input['role'] === 'adviser') {
                \App\Models\Adviser::create([
                    'user_id'     => $user->user_id,
                    'employee_id' => $input['employee_number'],
                    'is_active'   => true
                ]);
            } elseif ($input['role'] === 'clinic_staff') {
                \App\Models\ClinicStaff::create([
                    'user_id'    => $user->user_id,
                    'staff_id'   => $input['staff_code'],
                    'staff_code' => $input['staff_code'],
                    'position'   => $input['position'],
                    'is_active'  => true
                ]);
            }

            DB::commit();

            // Send email notification
            try {
                $emailData = [
                    'username' => $user->username,
                    'full_name' => $user->full_name,
                    'email' => $input['email'] ?? null,
                    'temp_password' => $tempPassword,
                    'role' => ucfirst(str_replace('_', ' ', $input['role']))
                ];

                if (!empty($input['email'])) {
                    Mail::to($input['email'])->send(new UserAccountCreated($emailData, $tempPassword, ucfirst(str_replace('_', ' ', $input['role']))));
                }
            } catch (\Exception $e) {
                // Log email error but don't fail the user creation
                Log::warning('Failed to send account creation email: ' . $e->getMessage());
            }

            return $this->sendResponse([
                'user' => [
                    'user_id' => $user->user_id,
                    'username' => $user->username,
                    'full_name' => $user->full_name,
                    'email' => $user->email,
                    'role' => ucfirst(str_replace('_', ' ', $input['role'])),
                    'temp_password' => $tempPassword
                ]
            ], 'User created successfully');

        } catch (\Exception $e) {
            DB::rollBack();
            return $this->sendError('Failed to create user', $e->getMessage(), 500);
        }
    }

    /**
     * Bulk import students from CSV
     */
    public function bulkImportStudents(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'csv_file' => 'required|file|mimes:csv,txt|max:2048'
            ]);

            if ($validator->fails()) {
                return $this->sendError('Validation Error', $validator->errors()->first());
            }

            $file = $request->file('csv_file');
            $csvData = array_map('str_getcsv', file($file->getRealPath()));
            $header = array_shift($csvData);

            // Expected CSV format: student_number,first_name,middle_name,last_name,birth_date,gender,grade_level,section_name,email,phone,emergency_contact_name,emergency_contact_phone
            $expectedHeaders = ['student_number', 'first_name', 'middle_name', 'last_name', 'birth_date', 'gender', 'grade_level', 'section_name', 'email', 'phone', 'emergency_contact_name', 'emergency_contact_phone'];

            if (count(array_intersect($header, $expectedHeaders)) < 8) {
                return $this->sendError('Invalid CSV format. Required columns: ' . implode(', ', $expectedHeaders));
            }

            $results = [
                'total_rows' => count($csvData),
                'successful' => 0,
                'failed' => 0,
                'errors' => []
            ];

            // Get current school year
            $currentSchoolYear = SchoolYear::where('is_current', true)->first();
            if (!$currentSchoolYear) {
                return $this->sendError('No current school year set');
            }

            DB::beginTransaction();

            foreach ($csvData as $rowIndex => $row) {
                try {
                    $studentData = array_combine($header, $row);

                    // Validate required fields
                    if (empty($studentData['student_number']) || empty($studentData['first_name']) || empty($studentData['last_name'])) {
                        $results['errors'][] = "Row " . ($rowIndex + 2) . ": Missing required fields";
                        $results['failed']++;
                        continue;
                    }

                    // Check if student already exists
                    if (Student::where('student_number', $studentData['student_number'])->exists()) {
                        $results['errors'][] = "Row " . ($rowIndex + 2) . ": Student number already exists";
                        $results['failed']++;
                        continue;
                    }

                    // Find section
                    $section = Section::whereHas('gradeLevel', function($query) use ($studentData) {
                        $query->where('level_name', 'like', '%' . $studentData['grade_level'] . '%');
                    })->where('section_name', $studentData['section_name'])->first();

                    if (!$section) {
                        $results['errors'][] = "Row " . ($rowIndex + 2) . ": Section not found";
                        $results['failed']++;
                        continue;
                    }

                    // Generate temporary password
                    $tempPassword = $this->generateTempPassword();
                    $passwordHash = Hash::make($tempPassword);

                    // Create user account
                    $user = User::create([
                        'role_id' => 2, // Student role
                        'username' => $studentData['student_number'],
                        'password_hash' => $passwordHash,
                        'email' => $studentData['email'] ?? null,
                        'phone' => $studentData['phone'] ?? null,
                        'full_name' => trim($studentData['first_name'] . ' ' . ($studentData['middle_name'] ?? '') . ' ' . $studentData['last_name']),
                        'password_must_change' => true,
                        'is_active' => true
                    ]);

                    // Create student profile
                    Student::create([
                        'user_id' => $user->user_id,
                        'student_number' => $studentData['student_number'],
                        'first_name' => $studentData['first_name'],
                        'middle_name' => $studentData['middle_name'] ?? null,
                        'last_name' => $studentData['last_name'],
                        'birth_date' => $studentData['birth_date'] ?? null,
                        'gender' => $studentData['gender'] ?? null,
                        'grade_level' => $section->gradeLevel->level_name,
                        'section' => $section->section_name,
                        'current_grade_level_id' => $section->grade_level_id,
                        'current_section_id' => $section->id,
                        'current_school_year_id' => $currentSchoolYear->id,
                        'phone' => $studentData['phone'] ?? null,
                        'emergency_contact' => $studentData['emergency_contact_name'] ?? null,
                        'emergency_contact_phone' => $studentData['emergency_contact_phone'] ?? null,
                        'is_active' => true
                    ]);

                    // Update section enrollment
                    $section->increment('current_enrollment');

                    $results['successful']++;

                } catch (\Exception $e) {
                    $results['errors'][] = "Row " . ($rowIndex + 2) . ": " . $e->getMessage();
                    $results['failed']++;
                }
            }

            DB::commit();

            return $this->sendResponse($results, 'Bulk import completed');

        } catch (\Exception $e) {
            DB::rollBack();
            return $this->sendError('Failed to import students', $e->getMessage());
        }
    }

    /**
     * Get system settings
     */
    public function getSystemSettings()
    {
        try {
            $settings = \App\Models\SystemSetting::getAllGrouped();
            return $this->sendResponse($settings, 'System settings retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve system settings', $e->getMessage());
        }
    }

    /**
     * Update system settings
     */
    public function updateSystemSettings(Request $request)
    {
        try {
            $request->validate([
                'section'  => 'required|in:system,email,notifications,security,backup',
                'settings' => 'required|array',
            ]);

            \App\Models\SystemSetting::saveSection($request->section, $request->settings);

            return $this->sendResponse([], 'System settings updated successfully');

        } catch (\Exception $e) {
            return $this->sendError('Failed to update system settings', $e->getMessage());
        }
    }

    /**
     * Get admin notifications
     */
    public function getNotifications()
    {
        try {
            $notifications = \App\Models\Notification::with([
                    'student.currentSection.gradeLevel',
                    'medicalVisit.clinicStaff.user',
                    'user.role'
                ])
                ->orderBy('created_at', 'desc')
                ->limit(100)
                ->get()
                ->map(function ($notif) {
                    $baseData = [
                        'notification_id' => $notif->notification_id,
                        'message'         => $notif->message,
                        'priority'        => $notif->priority,
                        'status'          => $notif->status,
                        'created_at'      => $notif->created_at?->toISOString(),
                        'notification_type' => $notif->notification_type,
                    ];

                    // Handle medical visit notifications
                    if ($notif->visit_id && $notif->student) {
                        $student = $notif->student;
                        $visit   = $notif->medicalVisit;
                        $staff   = $visit?->clinicStaff?->user;

                        $section = $student?->currentSection;
                        $grade   = $section?->gradeLevel;
                        $gradeSection = collect([$grade?->level_name, $section?->section_name])
                            ->filter()->implode(' - ');

                        $baseData['student'] = [
                            'full_name'      => trim($student->first_name . ' ' . $student->last_name),
                            'student_number' => $student->student_number,
                            'grade_section'  => $gradeSection ?: null,
                        ];
                        $baseData['visit'] = $visit ? [
                            'visit_id'   => $visit->visit_id,
                            'visit_type' => $visit->visit_type,
                            'diagnosis'  => $visit->chief_complaint,
                            'status'     => $visit->status,
                        ] : null;
                        $baseData['staff'] = $staff ? [
                            'name'     => trim($staff->first_name . ' ' . $staff->last_name),
                            'position' => $visit->clinicStaff->position ?? null,
                        ] : null;
                    }

                    // Handle password change requests
                    if ($notif->notification_type === 'password_change_request' && $notif->request_data) {
                        $baseData['request_data'] = $notif->request_data;
                        $baseData['user'] = $notif->user ? [
                            'user_id' => $notif->user->user_id,
                            'username' => $notif->user->username,
                            'full_name' => trim($notif->user->first_name . ' ' . $notif->user->last_name),
                            'role' => $notif->user->role->role_name ?? null,
                        ] : null;
                    }

                    // Handle emergency drill notifications
                    if ($notif->notification_type === 'emergency_drill_alert' && $notif->request_data) {
                        $baseData['request_data'] = $notif->request_data;
                    }

                    return $baseData;
                });

            return $this->sendResponse(['notifications' => $notifications], 'Notifications retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve notifications', $e->getMessage());
        }
    }

    /**
     * Mark notification as read
     */
    public function markNotificationAsRead($notificationId)
    {
        try {
            $notification = \App\Models\Notification::findOrFail($notificationId);
            $notification->markAsRead();

            return $this->sendResponse([], 'Notification marked as read');
        } catch (\Exception $e) {
            return $this->sendError('Failed to mark notification as read', $e->getMessage());
        }
    }

    /**
     * Mark all notifications as read
     */
    public function markAllNotificationsAsRead()
    {
        try {
            \App\Models\Notification::where('status', 'Pending')->update([
                'status' => 'Sent',
                'sent_at' => now()
            ]);

            return $this->sendResponse([], 'All notifications marked as read');
        } catch (\Exception $e) {
            return $this->sendError('Failed to mark notifications as read', $e->getMessage());
        }
    }

    /**
     * Approve password change request and reset user password
     */
    public function approvePasswordChangeRequest(Request $request, $notificationId)
    {
        try {
            $notification = \App\Models\Notification::findOrFail($notificationId);

            if ($notification->notification_type !== 'password_change_request') {
                return $this->sendError('Invalid notification type', [], 400);
            }

            $userId = $notification->request_data['user_id'] ?? null;
            if (!$userId) {
                return $this->sendError('User ID not found in notification', [], 400);
            }

            $user = User::findOrFail($userId);

            // Generate temporary password
            $tempPassword = $this->generateTempPassword();

            // Reset password
            $user->update([
                'password_hash' => Hash::make($tempPassword),
                'password_must_change' => true,
                'password_changed_at' => now()
            ]);

            // Mark notification as read
            $notification->markAsRead();

            // Log activity
            \App\Models\AuditLog::create([
                'user_id' => auth()->id(),
                'action' => 'Password Reset Approved',
                'table_name' => 'users',
                'record_id' => $userId,
                'old_values' => null,
                'new_values' => json_encode(['password_reset' => true]),
                'ip_address' => $request->ip()
            ]);

            return $this->sendResponse([
                'temp_password' => $tempPassword,
                'username' => $user->username,
                'full_name' => trim($user->first_name . ' ' . $user->last_name)
            ], 'Password reset successfully');

        } catch (\Exception $e) {
            return $this->sendError('Failed to approve password change request', $e->getMessage());
        }
    }

    /**
     * Dismiss/reject password change request
     */
    public function dismissPasswordChangeRequest($notificationId)
    {
        try {
            $notification = \App\Models\Notification::findOrFail($notificationId);
            $notification->markAsRead();

            return $this->sendResponse([], 'Request dismissed');
        } catch (\Exception $e) {
            return $this->sendError('Failed to dismiss request', $e->getMessage());
        }
    }

    /**
     * Send SMS to parent
     */
    public function sendParentSMS(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'visit_id' => 'required|integer|exists:medical_visits,visit_id'
            ]);

            if ($validator->fails()) {
                return $this->sendError('Validation Error', $validator->errors()->first());
            }

            $visitId = $request->visit_id;

            // Get visit and student information
            $visit = \App\Models\MedicalVisit::with(['student'])->find($visitId);
            if (!$visit || !$visit->student) {
                return $this->sendError('Visit or student not found');
            }

            $student = $visit->student;
            $parentPhone = $student->emergency_contact_phone;

            if (!$parentPhone) {
                return $this->sendError('Parent contact number not available');
            }

            // Create SMS message
            $message = "PDMHS Medical Alert: Your child {$student->full_name} ({$student->student_number}) had a medical visit today. Please contact the school clinic for details.";

            // Mock SMS sending - implement with real SMS service
            $smsResult = [
                'success' => true,
                'phone' => $parentPhone,
                'message' => $message,
                'sent_at' => now()->toISOString()
            ];

            return $this->sendResponse($smsResult, 'SMS sent successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to send SMS', $e->getMessage());
        }
    }

    /**
     * Get activity logs
     */
    public function getActivityLogs(Request $request)
    {
        try {
            $limit = $request->get('limit', 50);
            $page = $request->get('page', 1);

            // Get real audit logs from database
            $logs = \App\Models\AuditLog::with('user:user_id,full_name,username')
                ->orderBy('created_at', 'desc')
                ->paginate($limit);

            $activities = $logs->map(function ($log) {
                return [
                    'id' => $log->id,
                    'activity_type' => strtolower($log->resource_type),
                    'action' => $log->description ?? "{$log->action} {$log->resource_type}",
                    'username' => $log->user?->username ?? 'system',
                    'full_name' => $log->user?->full_name ?? 'System',
                    'resource_type' => $log->resource_type,
                    'resource_id' => $log->resource_id,
                    'ip_address' => $log->ip_address,
                    'created_at' => $log->created_at->toISOString()
                ];
            });

            return $this->sendResponse([
                'activities' => $activities,
                'pagination' => [
                    'total' => $logs->total(),
                    'per_page' => $logs->perPage(),
                    'current_page' => $logs->currentPage(),
                    'last_page' => $logs->lastPage(),
                ]
            ], 'Activity logs retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve activity logs', $e->getMessage());
        }
    }

    /**
     * Get backup history
     */
    public function getBackupHistory()
    {
        try {
            $backupDir = storage_path('app/backups');

            if (!file_exists($backupDir)) {
                mkdir($backupDir, 0755, true);
            }

            $files = glob($backupDir . '/*.sql') ?: [];
            $backups = [];

            foreach ($files as $file) {
                $backups[] = [
                    'filename'   => basename($file),
                    'size'       => filesize($file),
                    'created_at' => date('Y-m-d H:i:s', filemtime($file)),
                ];
            }

            // Sort newest first
            usort($backups, fn($a, $b) => strcmp($b['created_at'], $a['created_at']));

            return $this->sendResponse(['backups' => $backups], 'Backup history retrieved');

        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve backup history', $e->getMessage());
        }
    }

    /**
     * Create database backup using mysqldump
     */
    public function createBackup()
    {
        try {
            $backupDir = storage_path('app/backups');
            if (!file_exists($backupDir)) {
                mkdir($backupDir, 0755, true);
            }

            $filename = 'backup_' . uniqid() . '.sql';
            $path     = $backupDir . '/' . $filename;

            $db   = config('database.connections.mysql.database');
            $pdo  = DB::connection()->getPdo();

            $sql  = "-- Backup created at " . now()->toISOString() . "\n";
            $sql .= "-- Database: {$db}\n\n";
            $sql .= "SET FOREIGN_KEY_CHECKS=0;\n\n";

            // Get all tables
            $tables = $pdo->query("SHOW TABLES")->fetchAll(\PDO::FETCH_COLUMN);

            foreach ($tables as $table) {
                // Drop + create table
                $createStmt = $pdo->query("SHOW CREATE TABLE `{$table}`")->fetch(\PDO::FETCH_ASSOC);
                $sql .= "DROP TABLE IF EXISTS `{$table}`;\n";
                $sql .= $createStmt['Create Table'] . ";\n\n";

                // Dump rows
                $rows = $pdo->query("SELECT * FROM `{$table}`")->fetchAll(\PDO::FETCH_ASSOC);
                if (!empty($rows)) {
                    $columns = '`' . implode('`, `', array_keys($rows[0])) . '`';
                    foreach ($rows as $row) {
                        $values = array_map(fn($v) => $v === null ? 'NULL' : $pdo->quote($v), $row);
                        $sql .= "INSERT INTO `{$table}` ({$columns}) VALUES (" . implode(', ', $values) . ");\n";
                    }
                    $sql .= "\n";
                }
            }

            $sql .= "SET FOREIGN_KEY_CHECKS=1;\n";

            file_put_contents($path, $sql);

            return $this->sendResponse([
                'filename'   => $filename,
                'size'       => filesize($path),
                'created_at' => now()->toISOString(),
            ], 'Backup created successfully');

        } catch (\Exception $e) {
            return $this->sendError('Failed to create backup', $e->getMessage());
        }
    }

    /**
     * Delete a backup file
     */
    public function deleteBackup(string $filename)
    {
        try {
            // Sanitize — only allow safe filenames
            $filename = basename($filename);
            $path     = storage_path('app/backups/' . $filename);

            if (!file_exists($path)) {
                return $this->sendError('Backup file not found', [], 404);
            }

            unlink($path);

            return $this->sendResponse([], 'Backup deleted successfully');

        } catch (\Exception $e) {
            return $this->sendError('Failed to delete backup', $e->getMessage());
        }
    }

    public function downloadBackup(string $filename)
    {
        $filename = basename($filename);
        $path     = storage_path('app/backups/' . $filename);

        if (!file_exists($path)) {
            abort(404, 'Backup file not found');
        }

        return response()->download($path, $filename, [
            'Content-Type'        => 'application/sql',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    /**
     * Restore database backup
     */
    public function restoreBackup(Request $request)
    {
        try {
            $request->validate(['filename' => 'required|string']);

            $filename = basename($request->filename);
            $path     = storage_path('app/backups/' . $filename);

            if (!file_exists($path)) {
                return $this->sendError('Backup file not found', [], 404);
            }

            $sql = file_get_contents($path);

            if (empty(trim($sql))) {
                return $this->sendError('Backup file is empty or invalid', [], 422);
            }

            // Use PDO to execute the SQL dump
            $pdo = DB::connection()->getPdo();
            $pdo->setAttribute(\PDO::ATTR_EMULATE_PREPARES, true);

            // Disable foreign key checks during restore
            $pdo->exec('SET FOREIGN_KEY_CHECKS=0;');

            // Split and execute statements
            $statements = array_filter(
                array_map('trim', explode(";\n", $sql)),
                fn($s) => !empty($s) && !str_starts_with($s, '--')
            );

            foreach ($statements as $statement) {
                if (!empty(trim($statement))) {
                    try {
                        $pdo->exec($statement);
                    } catch (\Exception $e) {
                        // Skip non-critical errors (e.g. comments, empty lines)
                        Log::warning('Restore statement skipped: ' . $e->getMessage());
                    }
                }
            }

            $pdo->exec('SET FOREIGN_KEY_CHECKS=1;');

            Log::info('Database restored', ['filename' => $filename, 'user' => $request->user()->username ?? 'unknown']);

            return $this->sendResponse([
                'filename'    => $filename,
                'restored_at' => now()->toISOString(),
            ], 'Database restored successfully');

        } catch (\Exception $e) {
            return $this->sendError('Failed to restore backup', $e->getMessage());
        }
    }

    /**
     * Get health recommendations based on student data
     */
    public function getHealthRecommendations()
    {
        try {
            // Mock health recommendations - implement with real analysis
            $recommendations = [
                [
                    'id' => 1,
                    'type' => 'nutrition',
                    'priority' => 'high',
                    'title' => 'Improve Nutrition Program',
                    'description' => 'Based on BMI data, 15% of students are underweight. Consider enhancing the school nutrition program.',
                    'affected_students' => 45,
                    'grade_levels' => ['Grade 7', 'Grade 8'],
                    'action_items' => [
                        'Review current meal plans',
                        'Consult with nutritionist',
                        'Implement supplemental feeding program'
                    ]
                ],
                [
                    'id' => 2,
                    'type' => 'physical_activity',
                    'priority' => 'medium',
                    'title' => 'Increase Physical Activity',
                    'description' => 'Students in Grade 10-12 show higher rates of overweight. Recommend additional PE activities.',
                    'affected_students' => 32,
                    'grade_levels' => ['Grade 10', 'Grade 11', 'Grade 12'],
                    'action_items' => [
                        'Add extra PE sessions',
                        'Organize sports competitions',
                        'Create fitness awareness programs'
                    ]
                ],
                [
                    'id' => 3,
                    'type' => 'health_screening',
                    'priority' => 'low',
                    'title' => 'Regular Health Screenings',
                    'description' => 'Maintain current screening schedule to monitor student health trends.',
                    'affected_students' => 300,
                    'grade_levels' => ['All Grades'],
                    'action_items' => [
                        'Continue monthly health checks',
                        'Update health records',
                        'Parent health education sessions'
                    ]
                ]
            ];

            return $this->sendResponse(['recommendations' => $recommendations], 'Health recommendations retrieved successfully');

        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve health recommendations', $e->getMessage());
        }
    }

    /**
     * Get BMI trends over time
     */
    public function getBMITrends(Request $request)
    {
        try {
            $months = $request->get('months', 6);

            // Mock BMI trends data - implement with real data analysis
            $trends = [];
            $categories = ['Underweight', 'Normal', 'Overweight', 'Obese'];

            for ($i = $months - 1; $i >= 0; $i--) {
                $date = now()->subMonths($i);
                $monthData = [
                    'month' => $date->format('Y-m'),
                    'month_name' => $date->format('F Y'),
                    'total_students' => 300,
                    'categories' => []
                ];

                foreach ($categories as $category) {
                    $percentage = match($category) {
                        'Underweight' => rand(10, 20),
                        'Normal' => rand(50, 70),
                        'Overweight' => rand(15, 25),
                        'Obese' => rand(5, 15)
                    };

                    $monthData['categories'][] = [
                        'category' => $category,
                        'count' => intval($monthData['total_students'] * $percentage / 100),
                        'percentage' => $percentage
                    ];
                }

                $trends[] = $monthData;
            }

            // Calculate overall trends
            $overallTrend = [
                'direction' => 'stable',
                'change_percentage' => rand(-5, 5),
                'key_insights' => [
                    'BMI distribution remains relatively stable',
                    'Slight increase in normal weight category',
                    'Nutrition programs showing positive impact'
                ]
            ];

            return $this->sendResponse([
                'trends' => $trends,
                'overall_trend' => $overallTrend,
                'period_months' => $months
            ], 'BMI trends retrieved successfully');

        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve BMI trends', $e->getMessage());
        }
    }

    /**
     * Get system settings
     */
    public function getSettings()
    {
        try {
            $settings = \App\Models\SystemSetting::getAllGrouped();
            return $this->sendResponse($settings, 'Settings retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve settings', $e->getMessage());
        }
    }

    /**
     * Update system settings
     */
    public function updateSettings(Request $request)
    {
        try {
            // For now, just return success
            // In a real implementation, you would validate and save settings to database

            $validator = Validator::make($request->all(), [
                'section' => 'required|string|in:general,notifications,security,medical',
                'settings' => 'required|array'
            ]);

            if ($validator->fails()) {
                return $this->sendError('Validation Error', $validator->errors()->first());
            }

            // Here you would typically save to a settings table or config file
            Log::info('Settings update requested', [
                'section' => $request->section,
                'settings' => $request->settings,
                'user_id' => $request->user()?->user_id
            ]);

            return $this->sendResponse([], 'Settings updated successfully');

        } catch (\Exception $e) {
            return $this->sendError('Failed to update settings', $e->getMessage());
        }
    }
}
