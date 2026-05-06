<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\BaseController;
use App\Models\User;
use App\Models\Section;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class AdviserController extends BaseController
{
    private function isAdviserUser($user): bool
    {
        if (!$user) {
            return false;
        }

        if (intval($user->role_id) === 3) {
            return true;
        }

        $roleName = '';
        if (isset($user->role_name)) {
            $roleName = strtolower(trim((string) $user->role_name));
        } elseif (method_exists($user, 'role')) {
            $role = $user->role()->first();
            $roleName = strtolower(trim((string) ($role->role_name ?? '')));
        }

        return str_contains($roleName, 'adviser');
    }

    private function resolveAdviserSection(int $userId, ?int $schoolYearId = null): ?Section
    {
        $sectionQuery = Section::with(['gradeLevel', 'schoolYear'])
            ->where('adviser_id', $userId)
            ->where('is_active', true);

        if ($schoolYearId) {
            $sectionQuery->where('school_year_id', $schoolYearId);
        }

        $section = $sectionQuery->first();
        if ($section) {
            return $section;
        }

        $fallbackStudentQuery = Student::query()
            ->where('current_adviser_id', $userId)
            ->where('is_active', true)
            ->whereNotNull('current_section_id');

        if ($schoolYearId) {
            $fallbackStudentQuery->where('current_school_year_id', $schoolYearId);
        }

        $fallbackStudent = $fallbackStudentQuery->orderByDesc('student_id')->first();
        if ($fallbackStudent && $fallbackStudent->current_section_id) {
            return Section::with(['gradeLevel', 'schoolYear'])
                ->where('id', $fallbackStudent->current_section_id)
                ->first();
        }

        return null;
    }

    private function getSectionGradeCandidates(?Section $section): array
    {
        if (!$section || !$section->gradeLevel) {
            return [];
        }

        $candidates = [];
        $levelName = trim((string) ($section->gradeLevel->level_name ?? ''));
        $levelNumber = trim((string) ($section->gradeLevel->level_number ?? ''));

        if ($levelName !== '') {
            $candidates[] = $levelName;
            $digits = preg_replace('/[^0-9]/', '', $levelName);
            if (!empty($digits)) {
                $candidates[] = $digits;
            }
        }

        if ($levelNumber !== '') {
            $candidates[] = $levelNumber;
            $candidates[] = 'Grade ' . $levelNumber;
        }

        return array_values(array_unique(array_filter($candidates, fn ($value) => $value !== '')));
    }

    private function applyAdviserStudentScope($query, int $userId, ?Section $section)
    {
        $gradeCandidates = $this->getSectionGradeCandidates($section);

        return $query->where(function ($outer) use ($userId, $section, $gradeCandidates) {
            if ($section) {
                $outer->where('current_section_id', $section->id)
                    ->orWhere('current_adviser_id', $userId)
                    ->orWhere(function ($textMatch) use ($section, $gradeCandidates) {
                        $textMatch->where('section', $section->section_name);
                        if (!empty($gradeCandidates)) {
                            $textMatch->whereIn('grade_level', $gradeCandidates);
                        }
                    });
            } else {
                $outer->where('current_adviser_id', $userId);
            }
        });
    }

    /**
     * Get adviser profile information including advisory class
     */
    public function getProfile(Request $request)
    {
        \Log::info('=== ADVISER PROFILE API CALLED ===');

        try {
            $user = $request->user();

            \Log::info('User from request:', [
                'user_id' => $user ? $user->user_id : 'null',
                'full_name' => $user ? $user->full_name : 'null',
                'role_id' => $user ? $user->role_id : 'null'
            ]);

            if (!$this->isAdviserUser($user)) {
                \Log::warning('User is not an adviser');
                return $this->sendError('Unauthorized', 'User is not an adviser');
            }

            // Get adviser's assigned section
            $section = $this->resolveAdviserSection(intval($user->user_id));

            $advisoryClass = 'Not assigned';
            $studentCount = 0;

            if ($section) {
                $gradeLevelName = $section->gradeLevel ? $section->gradeLevel->level_name : ($section->level_name ?? 'Grade');
                $advisoryClass = $gradeLevelName . ' - ' . $section->section_name;
                $studentCount = $this->applyAdviserStudentScope(
                    Student::query()->where('is_active', true),
                    intval($user->user_id),
                    $section
                    )
                    ->count();
            }

            // Get adviser record for additional fields
            $adviser = \App\Models\Adviser::where('user_id', $user->user_id)->first();

            \Log::info('Adviser Profile Debug', [
                'user_id' => $user->user_id,
                'adviser_found' => $adviser ? 'yes' : 'no',
                'adviser_id' => $adviser ? $adviser->adviser_id : 'no record',
                'employee_id' => $adviser ? $adviser->employee_id : 'no adviser record',
                'birth_date' => $adviser ? $adviser->birth_date : 'no adviser record'
            ]);

            $profileData = [
                'user_id' => $user->user_id,
                'full_name' => $user->full_name,
                'email' => $user->email,
                'phone' => $user->phone,
                'employee_id' => $adviser ? $adviser->employee_id : null,
                'birth_date' => $adviser ? $adviser->birth_date : null,
                'address' => $adviser ? $adviser->address : null,
                'advisory_class' => $advisoryClass,
                'student_count' => $studentCount,
                'section_id' => $section ? $section->id : null,
                'grade_level' => $section && $section->gradeLevel ? $section->gradeLevel->level_name : null,
                'section_name' => $section ? $section->section_name : null,
                'school_year' => $section && $section->schoolYear ? $section->schoolYear->year_name : null,
                'gender' => $user->gender ?? null,
            ];

            \Log::info('Profile data to return:', $profileData);

            return $this->sendResponse($profileData, 'Adviser profile retrieved successfully');
        } catch (\Exception $e) {
            \Log::error('Error in getProfile:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->sendError('Failed to retrieve adviser profile', $e->getMessage());
        }
    }

    /**
     * Update adviser profile
     */
    public function updateProfile(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user || $user->role_id !== 3) {
                return $this->sendError('Unauthorized', 'User is not an adviser');
            }

            $validator = Validator::make($request->all(), [
                'full_name' => 'sometimes|string|max:255',
                'email' => 'sometimes|email|max:255|unique:users,email,' . $user->user_id . ',user_id',
                'phone' => 'sometimes|nullable|string|max:20',
                'employee_id' => 'sometimes|nullable|string|max:50',
                'birth_date' => 'sometimes|nullable|date',
                'address' => 'sometimes|nullable|string|max:500'
            ]);

            if ($validator->fails()) {
                return $this->sendError('Validation Error', $validator->errors()->first());
            }

            // Update user table fields
            $userUpdateData = [];
            if ($request->has('full_name')) {
                $userUpdateData['full_name'] = $request->full_name;
            }
            if ($request->has('email')) {
                $userUpdateData['email'] = $request->email;
            }
            if ($request->has('phone')) {
                $userUpdateData['phone'] = $request->phone;
            }

            if (!empty($userUpdateData)) {
                $user->update($userUpdateData);
            }

            // Update adviser table fields
            $adviser = \App\Models\Adviser::where('user_id', $user->user_id)->first();
            if ($adviser) {
                $adviserUpdateData = [];
                if ($request->has('employee_id')) {
                    $adviserUpdateData['employee_id'] = $request->employee_id;
                }
                if ($request->has('birth_date')) {
                    $adviserUpdateData['birth_date'] = $request->birth_date;
                }
                if ($request->has('address')) {
                    $adviserUpdateData['address'] = $request->address;
                }

                if (!empty($adviserUpdateData)) {
                    $adviser->update($adviserUpdateData);
                }
            }

            return $this->sendResponse($user->fresh(), 'Profile updated successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to update profile', $e->getMessage());
        }
    }

    /**
     * Get adviser dashboard data
     */
    public function getDashboard(Request $request)
    {
        try {
            $user = $request->user();

            if (!$this->isAdviserUser($user)) {
                return $this->sendError('Unauthorized', 'User is not an adviser');
            }

            $section = $this->resolveAdviserSection(intval($user->user_id));

            $studentsQuery = Student::with(['allergies'])
                ->where('is_active', true);

            $studentsQuery = $this->applyAdviserStudentScope(
                $studentsQuery,
                intval($user->user_id),
                $section
            );

            $students = $studentsQuery->get();

            $dashboardData = [
                'adviser' => [
                    'user_id' => $user->user_id,
                    'full_name' => $user->full_name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'employee_id' => $adviser ? $adviser->employee_id : null,
                    'gender' => $user->gender ?? null,
                ],
                'section' => null,
                'students' => [],
                'stats' => [
                    'total_students' => 0,
                    'students_with_allergies' => 0,
                    'recent_visits' => 0
                ]
            ];

            if ($section) {
                $dashboardData['section'] = [
                    'id' => $section->id,
                    'section_name' => $section->section_name,
                    'grade_level' => $section->gradeLevel->level_name ?? 'Unknown',
                    'school_year' => $section->schoolYear->year_name ?? 'Unknown',
                    'capacity' => $section->capacity,
                    'current_enrollment' => $students->count()
                ];

                $dashboardData['students'] = $students->map(function($student) {
                    return [
                        'student_id' => $student->student_id,
                        'student_number' => $student->student_number,
                        'full_name' => trim($student->first_name . ' ' . $student->last_name),
                        'gender' => $student->gender,
                        'blood_type' => $student->blood_type,
                        'emergency_contact' => $student->emergency_contact,
                        'has_allergies' => $student->allergies()->count() > 0
                    ];
                });

                $dashboardData['stats'] = [
                    'total_students' => $students->count(),
                    'students_with_allergies' => $students->filter(function($student) {
                        return $student->allergies()->count() > 0;
                    })->count(),
                    'recent_visits' => $students->sum(function($student) {
                        return $student->medicalVisits()->where('visit_datetime', '>=', now()->subDays(7))->count();
                    })
                ];

                // Add advisory class info to adviser data
                $dashboardData['adviser']['grade_level'] = $section->gradeLevel->level_name ?? 'Unknown';
                $dashboardData['adviser']['section'] = $section->section_name;
                $dashboardData['adviser']['advisory_class'] = $section->gradeLevel->level_name . ' - ' . $section->section_name;
            } else {
                $dashboardData['students'] = $students->map(function($student) {
                    return [
                        'student_id' => $student->student_id,
                        'student_number' => $student->student_number,
                        'full_name' => trim($student->first_name . ' ' . $student->last_name),
                        'gender' => $student->gender,
                        'blood_type' => $student->blood_type,
                        'emergency_contact' => $student->emergency_contact,
                        'has_allergies' => $student->allergies()->count() > 0
                    ];
                });

                $dashboardData['stats'] = [
                    'total_students' => $students->count(),
                    'students_with_allergies' => $students->filter(function($student) {
                        return $student->allergies()->count() > 0;
                    })->count(),
                    'recent_visits' => $students->sum(function($student) {
                        return $student->medicalVisits()->where('visit_datetime', '>=', now()->subDays(7))->count();
                    })
                ];
            }

            return $this->sendResponse($dashboardData, 'Adviser dashboard data retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve dashboard data', $e->getMessage());
        }
    }

    /**
     * Get health monitoring heatmap data
     */
    public function getHealthHeatmap(Request $request)
    {
        try {
            $user = $request->user();

            // Debug logging
            \Log::info('Health heatmap request', [
                'user' => $user ? $user->user_id : 'null',
                'role_id' => $user ? $user->role_id : 'null',
                'token' => $request->bearerToken() ? 'present' : 'missing'
            ]);

            if (!$this->isAdviserUser($user)) {
                \Log::warning('Unauthorized heatmap access', [
                    'user_id' => $user ? $user->user_id : 'null',
                    'role_id' => $user ? $user->role_id : 'null'
                ]);
                return $this->sendError('Unauthorized', 'User is not an adviser');
            }

            $days = $request->get('days', 7);
            $startDate = now()->subDays($days);

            // Get adviser's section
            $section = $this->resolveAdviserSection(intval($user->user_id));

            // Get students in adviser's advisory scope (with fallbacks)
            $studentsQuery = Student::query()->where('is_active', true);
            $students = $this->applyAdviserStudentScope(
                $studentsQuery,
                intval($user->user_id),
                $section
            )->get();

            $totalStudents = $students->count();

            // Get medical visits for the period
            $visits = \App\Models\MedicalVisit::whereIn('student_id', $students->pluck('student_id'))
                ->where('visit_datetime', '>=', $startDate)
                ->with(['student'])
                ->get();

            // Group visits by date
            $visitsByDate = [];
            for ($i = 0; $i < $days; $i++) {
                $date = now()->subDays($i)->format('Y-m-d');
                $dayVisits = $visits->filter(function($visit) use ($date) {
                    return $visit->visit_datetime->format('Y-m-d') === $date;
                });

                $uniqueStudents = $dayVisits->pluck('student_id')->unique();
                $percentage = $totalStudents > 0 ? round(($uniqueStudents->count() / $totalStudents) * 100, 1) : 0;

                // Group symptoms
                $symptoms = [];
                foreach ($dayVisits as $visit) {
                    $diagnosis = !empty($visit->chief_complaint) ? $visit->chief_complaint : 'General Visit';
                    if (!isset($symptoms[$diagnosis])) {
                        $symptoms[$diagnosis] = ['count' => 0, 'students' => []];
                    }
                    $symptoms[$diagnosis]['count']++;
                    $studentName = trim($visit->student->first_name . ' ' . $visit->student->last_name);
                    if (!in_array($studentName, $symptoms[$diagnosis]['students'])) {
                        $symptoms[$diagnosis]['students'][] = $studentName;
                    }
                }

                $visitsByDate[] = [
                    'date' => $date,
                    'total_visits' => $dayVisits->count(),
                    'unique_students' => $uniqueStudents->count(),
                    'percentage' => $percentage,
                    'symptoms' => $symptoms
                ];
            }

            // Calculate trending symptoms
            $allSymptoms = [];
            foreach ($visits as $visit) {
                $diagnosis = !empty($visit->chief_complaint) ? $visit->chief_complaint : 'General Visit';
                if (!isset($allSymptoms[$diagnosis])) {
                    $allSymptoms[$diagnosis] = ['students' => [], 'visits' => 0];
                }
                $allSymptoms[$diagnosis]['students'][] = $visit->student_id;
                $allSymptoms[$diagnosis]['visits']++;
            }

            $trendingSymptoms = [];
            foreach ($allSymptoms as $symptom => $data) {
                $uniqueStudents = array_unique($data['students']);
                $percentage = $totalStudents > 0 ? round((count($uniqueStudents) / $totalStudents) * 100, 1) : 0;

                $trendingSymptoms[] = [
                    'symptom' => $symptom,
                    'student_count' => count($uniqueStudents),
                    'visit_count' => $data['visits'],
                    'percentage' => $percentage
                ];
            }

            // Sort by student count
            usort($trendingSymptoms, function($a, $b) {
                return $b['student_count'] - $a['student_count'];
            });

            // Generate alerts
            $alerts = [];
            $highRiskDays = array_filter($visitsByDate, function($day) {
                return $day['percentage'] > 15;
            });

            if (count($highRiskDays) > 0) {
                $alerts[] = [
                    'type' => 'health_outbreak',
                    'severity' => 'high',
                    'message' => 'High clinic visit rate detected (' . count($highRiskDays) . ' days above 15%)',
                    'recommendation' => 'Monitor for potential health outbreak. Consider notifying school health coordinator.'
                ];
            }

            $fallbackStudent = $students->first();
            $advisoryClass = 'Not assigned';
            if ($section && $section->gradeLevel) {
                $advisoryClass = $section->gradeLevel->level_name . ' - ' . $section->section_name;
            } elseif ($fallbackStudent) {
                $fallbackGrade = $fallbackStudent->grade_level ?: 'Unknown';
                $fallbackSection = $fallbackStudent->section ?: 'Unknown';
                $advisoryClass = $fallbackGrade . ' - ' . $fallbackSection;
            }

            $heatmapData = [
                'advisory_class' => $advisoryClass,
                'total_students' => $totalStudents,
                'visits_by_date' => array_reverse($visitsByDate), // Most recent first
                'trending_symptoms' => array_slice($trendingSymptoms, 0, 10), // Top 10
                'alerts' => $alerts,
                'period_days' => $days
            ];

            return $this->sendResponse($heatmapData, 'Health heatmap data retrieved successfully');
        } catch (\Exception $e) {
            \Log::error('Health heatmap error: ' . $e->getMessage(), [
                'user_id' => $user->user_id,
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->sendError('Failed to retrieve health heatmap data', $e->getMessage());
        }
    }

    /**
     * Get class roster for a school year
     */
    public function getClassRoster(Request $request)
    {
        try {
            $user = $request->user();

            if (!$this->isAdviserUser($user)) {
                return $this->sendError('Unauthorized', 'User is not an adviser');
            }

            $schoolYearId = $request->get('school_year_id');
            if (!$schoolYearId) {
                return $this->sendError('School year ID is required');
            }

            // Get adviser's section for the specified school year
            $section = $this->resolveAdviserSection(intval($user->user_id), intval($schoolYearId));

            // Get students in the section (fallback to adviser assignment when section link is missing)
            $studentsQuery = Student::with(['user', 'allergies', 'medicalVisits' => function($query) {
                    $query->orderBy('visit_datetime', 'desc')->limit(1);
                }])
                ->where('is_active', true);

            $studentsQuery = $this->applyAdviserStudentScope(
                $studentsQuery,
                intval($user->user_id),
                $section
            );

            $students = $studentsQuery->orderBy('last_name')
                ->orderBy('first_name')
                ->get()
                ->map(function($student) {
                    $lastVisit = $student->medicalVisits->first();
                    $totalMedicalVisits = $student->medicalVisits()->count();
                    return [
                        'student_id' => $student->student_id,
                        'student_number' => $student->student_number,
                        'first_name' => $student->first_name,
                        'last_name' => $student->last_name,
                        'full_name' => trim($student->first_name . ' ' . $student->last_name),
                        'gender' => $student->gender,
                        'birth_date' => $student->birth_date,
                        'blood_type' => $student->blood_type,
                        'emergency_contact' => $student->emergency_contact,
                        'emergency_contact_phone' => $student->emergency_contact_phone,
                        'allergies' => $student->allergies->map(function($allergy) {
                            return $allergy->allergy_name ?? $allergy->allergy_text;
                        })->filter()->values()->toArray(),
                        'email' => $student->user ? $student->user->email : null,
                        'phone' => $student->user ? $student->user->phone : null,
                        'total_medical_visits' => $totalMedicalVisits,
                        'last_visit_date' => $lastVisit ? $lastVisit->visit_datetime->format('Y-m-d') : null,
                        'last_visit' => $lastVisit ? [
                            'visit_id' => $lastVisit->visit_id,
                            'visit_date' => $lastVisit->visit_datetime->format('Y-m-d'),
                            'diagnosis' => $lastVisit->chief_complaint,
                            'status' => $lastVisit->status
                        ] : null,
                        'promotion_eligible' => true // Can be enhanced with business logic
                    ];
                });

            $firstStudent = $students->first();
            $fallbackSectionName = is_array($firstStudent) ? ($firstStudent['section'] ?? 'Unassigned') : 'Unassigned';
            $fallbackGradeLevelName = is_array($firstStudent) ? ($firstStudent['grade_level'] ?? 'Unassigned') : 'Unassigned';

            $rosterData = [
                'section' => [
                    'id' => $section ? $section->id : null,
                    'section_name' => $section ? $section->section_name : $fallbackSectionName,
                    'level_name' => $section && $section->gradeLevel ? $section->gradeLevel->level_name : $fallbackGradeLevelName,
                    'level_number' => $section && $section->gradeLevel ? $section->gradeLevel->level_number : null,
                    'school_year' => $section && $section->schoolYear ? $section->schoolYear->year_name : null,
                    'capacity' => $section ? $section->capacity : null
                ],
                'students' => $students,
                'total_students' => $students->count()
            ];

            return $this->sendResponse($rosterData, 'Class roster retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve class roster', $e->getMessage());
        }
    }

    /**
     * Get adviser notifications
     */
    public function getNotifications(Request $request)
    {
        try {
            $user = $request->user();

            if (!$this->isAdviserUser($user)) {
                return $this->sendError('Unauthorized', 'User is not an adviser');
            }

            $section = $this->resolveAdviserSection(intval($user->user_id));
            $studentsQuery = Student::query()->where('is_active', true);
            $students = $this->applyAdviserStudentScope(
                $studentsQuery,
                intval($user->user_id),
                $section
            )->get(['student_id', 'student_number', 'first_name', 'last_name']);

            if ($students->isEmpty()) {
                return $this->sendResponse([
                    'notifications' => [],
                    'total' => 0,
                ], 'Adviser notifications retrieved successfully');
            }

            $studentMap = $students->keyBy('student_id');
            $studentIds = $students->pluck('student_id')->all();

            $visitRows = DB::table('medical_visits as mv')
                ->leftJoin('clinic_staff as cs', 'mv.clinic_staff_id', '=', 'cs.clinic_staff_id')
                ->leftJoin('users as staff_user', 'cs.user_id', '=', 'staff_user.user_id')
                ->whereIn('mv.student_id', $studentIds)
                ->orderByDesc('mv.visit_datetime')
                ->limit(100)
                ->get([
                    'mv.visit_id',
                    'mv.student_id',
                    'mv.visit_datetime',
                    'mv.visit_type',
                    'mv.chief_complaint',
                    'mv.notes',
                    'mv.status',
                    'cs.position as staff_position',
                    'staff_user.full_name as staff_name',
                ]);

            $notifications = $visitRows->map(function ($row) use ($studentMap) {
                $student = $studentMap->get($row->student_id);
                if (!$student) {
                    return null;
                }

                $timestamp = $row->visit_datetime ? \Carbon\Carbon::parse($row->visit_datetime)->setTimezone(config('app.timezone')) : now();
                $visitType = (string)($row->visit_type ?? 'Visit');
                $messageSource = trim((string)($row->notes ?: $row->chief_complaint ?: 'Student visited clinic for assessment.'));
                $previewText = mb_substr($messageSource, 0, 100) . (mb_strlen($messageSource) > 100 ? '...' : '');

                $isUrgent = strcasecmp($visitType, 'Emergency') === 0
                    || str_contains(strtolower($messageSource), 'urgent')
                    || str_contains(strtolower($messageSource), 'critical');

                return [
                    'id' => intval($row->visit_id),
                    'studentId' => intval($row->student_id),
                    'senderName' => $row->staff_name ?: 'Clinic Staff',
                    'senderRole' => $row->staff_position ?: 'Clinic Staff',
                    'studentName' => trim($student->first_name . ' ' . $student->last_name),
                    'studentNumber' => $student->student_number,
                    'subject' => ucfirst(strtolower($visitType)) . ' Visit',
                    'previewText' => $previewText,
                    'fullMessage' => $messageSource,
                    'timeAgo' => $this->formatTimeAgo($timestamp),
                    'fullDate' => $timestamp->format('M d, Y \a\t h:i A'),
                    'createdAt' => $timestamp->toISOString(),
                    'visitType' => ucfirst(strtolower($visitType)),
                    'priority' => $isUrgent ? 'urgent' : 'normal',
                    'isRead' => false,
                    'isExpanded' => false,
                ];
            })->filter()->values()->all();

            return $this->sendResponse([
                'notifications' => $notifications,
                'total' => count($notifications),
            ], 'Adviser notifications retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve notifications', $e->getMessage());
        }
    }

    private function formatTimeAgo($timestamp): string
    {
        $now = now();

        if ($timestamp->greaterThan($now)) {
            return 'Just now';
        }

        $seconds = $timestamp->diffInSeconds($now);
        if ($seconds < 60) {
            return 'Just now';
        }

        $minutes = $timestamp->diffInMinutes($now);
        if ($minutes < 60) {
            return $minutes . 'm ago';
        }

        $hours = $timestamp->diffInHours($now);
        if ($hours < 24) {
            return $hours . 'h ago';
        }

        $days = $timestamp->diffInDays($now);
        return $days . 'd ago';
    }
    /**
     * Download SHDF data for a specific student (adviser must own the student)
     * Returns full SHDF record including basic info and comprehensive form data
     */
    public function downloadStudentSHDF(Request $request, int $studentId)
    {
        try {
            $user = $request->user();

            if (!$this->isAdviserUser($user)) {
                return $this->sendError('Unauthorized', 'User is not an adviser');
            }

            $section = $this->resolveAdviserSection(intval($user->user_id));

            // Verify the student belongs to this adviser's advisory
            $studentQuery = Student::with([
                'philhealth',
                'immunization',
                'medicalHistory',
                'familyHistory',
                'allergies',
            ])->where('student_id', $studentId)->where('is_active', true);

            $studentQuery = $this->applyAdviserStudentScope(
                $studentQuery,
                intval($user->user_id),
                $section
            );

            $student = $studentQuery->first();

            if (!$student) {
                return $this->sendError('Student not found', 'Student does not belong to your advisory class');
            }

            // Get current school year
            $schoolYear = \App\Models\SchoolYear::where('is_current', true)->first();
            if (!$schoolYear) {
                return $this->sendError('No current school year found');
            }

            // Check SHDF status
            $status = \App\Models\StudentSHDFStatus::where('student_id', $studentId)
                ->where('school_year_id', $schoolYear->id)
                ->first();

            if (!$status || !$status->basic_completed) {
                return $this->sendError('SHDF not completed', 'Student has not completed the basic SHDF form');
            }

            // Get parental consent
            $consent = \App\Models\StudentParentalConsent::where('student_id', $studentId)
                ->where('school_year_id', $schoolYear->id)
                ->first();

            // Get user email/phone
            $studentUser = $student->user;

            $data = [
                'student' => [
                    'student_id'                     => $student->student_id,
                    'student_number'                 => $student->student_number,
                    'first_name'                     => $student->first_name,
                    'middle_name'                    => $student->middle_name,
                    'last_name'                      => $student->last_name,
                    'full_name'                      => trim($student->first_name . ' ' . $student->middle_name . ' ' . $student->last_name),
                    'birth_date'                     => $student->birth_date ? $student->birth_date->format('Y-m-d') : null,
                    'gender'                         => $student->gender,
                    'grade_level'                    => $section && $section->gradeLevel ? $section->gradeLevel->level_name : $student->grade_level,
                    'section'                        => $section ? $section->section_name : $student->section,
                    'address'                        => $student->address,
                    'blood_type'                     => $student->blood_type,
                    'height_cm'                      => $student->height_cm,
                    'weight_kg'                      => $student->weight_kg,
                    'bmi'                            => $student->bmi,
                    'bmi_category'                   => $student->bmi_category,
                    'parent_guardian_name'           => $student->parent_guardian_name,
                    'emergency_contact'              => $student->emergency_contact,
                    'emergency_contact_relation'     => $student->emergency_contact_relation,
                    'emergency_contact_phone'        => $student->emergency_contact_phone,
                    'email'                          => $studentUser ? $studentUser->email : null,
                    'phone'                          => $studentUser ? $studentUser->phone : null,
                ],
                'philhealth'      => $student->philhealth,
                'immunization'    => $student->immunization,
                'medical_history' => $student->medicalHistory,
                'family_history'  => $student->familyHistory,
                'allergies'       => $student->allergies->map(fn($a) => $a->allergy_name ?? $a->allergy_text)->filter()->values(),
                'parental_consent' => $consent ? [
                    'information_certified'    => $consent->information_certified,
                    'deworming_consent'        => $consent->deworming_consent,
                    'deworming_refusal_reason' => $consent->deworming_refusal_reason,
                    'mrtd_consent'             => $consent->mrtd_consent,
                    'wifa_consent'             => $consent->wifa_consent,
                    'submitted_at'             => $consent->submitted_at ? $consent->submitted_at->format('Y-m-d H:i:s') : null,
                ] : null,
                'status' => [
                    'basic_completed'              => $status->basic_completed,
                    'basic_completed_at'           => $status->basic_completed_at ? $status->basic_completed_at->format('Y-m-d H:i:s') : null,
                    'comprehensive_completed'      => $status->comprehensive_completed,
                    'comprehensive_completed_at'   => $status->comprehensive_completed_at ? $status->comprehensive_completed_at->format('Y-m-d H:i:s') : null,
                ],
                'school_year' => [
                    'id'        => $schoolYear->id,
                    'year_name' => $schoolYear->year_name,
                ],
                'adviser' => [
                    'full_name'      => $user->full_name,
                    'advisory_class' => $section ? (($section->gradeLevel->level_name ?? '') . ' - ' . $section->section_name) : 'N/A',
                ],
            ];

            return $this->sendResponse($data, 'SHDF data retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve SHDF data', $e->getMessage());
        }
    }

    /**
     * Get advisory students with SHDF completion status
     */
    public function getAdvisoryStudentsWithSHDF(Request $request)
    {
        try {
            $user = $request->user();

            if (!$this->isAdviserUser($user)) {
                return $this->sendError('Unauthorized', 'User is not an adviser');
            }

            $section = $this->resolveAdviserSection(intval($user->user_id));

            $studentsQuery = Student::with(['allergies'])
                ->where('is_active', true);

            $studentsQuery = $this->applyAdviserStudentScope(
                $studentsQuery,
                intval($user->user_id),
                $section
            );

            $students = $studentsQuery->orderBy('last_name')->orderBy('first_name')->get();

            $schoolYear = \App\Models\SchoolYear::where('is_current', true)->first();
            $schoolYearId = $schoolYear ? $schoolYear->id : null;

            // Get SHDF statuses for all students in one query
            $shdfStatuses = [];
            if ($schoolYearId) {
                $statuses = \App\Models\StudentSHDFStatus::whereIn('student_id', $students->pluck('student_id'))
                    ->where('school_year_id', $schoolYearId)
                    ->get()
                    ->keyBy('student_id');
                $shdfStatuses = $statuses->toArray();
            }

            $gradeLevelName = $section && $section->gradeLevel ? $section->gradeLevel->level_name : null;
            $sectionName = $section ? $section->section_name : null;

            $result = $students->map(function ($student) use ($shdfStatuses, $gradeLevelName, $sectionName) {
                $status = $shdfStatuses[$student->student_id] ?? null;
                return [
                    'student_id'              => $student->student_id,
                    'student_number'          => $student->student_number,
                    'full_name'               => trim($student->first_name . ' ' . $student->middle_name . ' ' . $student->last_name),
                    'first_name'              => $student->first_name,
                    'last_name'               => $student->last_name,
                    'gender'                  => $student->gender,
                    'grade_level'             => $gradeLevelName ?? $student->grade_level,
                    'section'                 => $sectionName ?? $student->section,
                    'basic_completed'         => $status ? (bool)($status['basic_completed'] ?? false) : false,
                    'comprehensive_completed' => $status ? (bool)($status['comprehensive_completed'] ?? false) : false,
                    'is_fully_compliant'      => $status ? ((bool)($status['basic_completed'] ?? false) && (bool)($status['comprehensive_completed'] ?? false)) : false,
                ];
            });

            $advisoryClass = 'Not assigned';
            if ($section && $section->gradeLevel) {
                $advisoryClass = $section->gradeLevel->level_name . ' - ' . $section->section_name;
            }

            return $this->sendResponse([
                'students'      => $result,
                'advisory_class' => $advisoryClass,
                'school_year'   => $schoolYear ? $schoolYear->year_name : null,
                'stats' => [
                    'total'                   => $students->count(),
                    'basic_completed'         => collect($result)->where('basic_completed', true)->count(),
                    'comprehensive_completed' => collect($result)->where('comprehensive_completed', true)->count(),
                    'fully_compliant'         => collect($result)->where('is_fully_compliant', true)->count(),
                ],
            ], 'Advisory students with SHDF status retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve students', $e->getMessage());
        }
    }

    public function getAdvisoryStudents(Request $request)
    {
        try {
            $user = $request->user();

            if (!$this->isAdviserUser($user)) {
                return $this->sendError('Unauthorized', 'User is not an adviser');
            }

            $section = $this->resolveAdviserSection(intval($user->user_id));

            // Get students with medical data
            $studentsQuery = Student::with(['user', 'allergies', 'medicalVisits' => function($query) {
                    $query->orderBy('visit_datetime', 'desc')->limit(5);
                }])
                ->where('is_active', true);

            $studentsQuery = $this->applyAdviserStudentScope(
                $studentsQuery,
                intval($user->user_id),
                $section
            );

            $studentsCollection = $studentsQuery->get();

            // Calculate statistics before mapping
            $totalStudents = $studentsCollection->count();
            $clinicVisitsThisMonth = $studentsCollection->sum(function($student) {
                return $student->medicalVisits()
                    ->where('visit_datetime', '>=', now()->startOfMonth())
                    ->count();
            });
            $studentsWithAllergies = $studentsCollection->filter(function($student) {
                return $student->allergies->count() > 0;
            })->count();

            // Map students to response format
            $students = $studentsCollection->map(function($student) use ($section) {
                $allergyList = $student->allergies->map(function($allergy) {
                    return $allergy->allergy_name ?? $allergy->allergy_text;
                })->filter()->values()->toArray();

                $gradeLevelName = $section && $section->gradeLevel
                    ? $section->gradeLevel->level_name
                    : ($student->grade_level ?: 'Unknown');
                $sectionName = $section ? $section->section_name : ($student->section ?: 'Unknown');

                return [
                    'student_id' => $student->student_id,
                    'student_number' => $student->student_number,
                    'first_name' => $student->first_name,
                    'middle_name' => $student->middle_name,
                    'last_name' => $student->last_name,
                    'full_name' => trim($student->first_name . ' ' . $student->middle_name . ' ' . $student->last_name),
                    'birth_date' => $student->birth_date,
                    'gender' => $student->gender,
                    'grade_level' => $gradeLevelName,
                    'section' => $sectionName,
                    'grade_section' => $gradeLevelName . ' - ' . $sectionName,
                    'blood_type' => $student->blood_type,
                    'emergency_contact' => $student->emergency_contact,
                    'email' => $student->user ? $student->user->email : null,
                    'phone' => $student->user ? $student->user->phone : null,
                    'allergies' => $allergyList,
                    'last_visit' => $student->medicalVisits->first() ? [
                        'visit_id' => $student->medicalVisits->first()->visit_id,
                        'visit_date' => $student->medicalVisits->first()->visit_datetime->format('Y-m-d'),
                        'reason' => $student->medicalVisits->first()->chief_complaint ?? 'N/A',
                        'diagnosis' => $student->medicalVisits->first()->chief_complaint,
                        'status' => $student->medicalVisits->first()->status
                    ] : null
                ];
            });

            $advisoryData = [
                'adviser' => [
                    'adviser_id' => $user->user_id,
                    'name' => $user->full_name,
                    'grade_level' => $section && $section->gradeLevel ? $section->gradeLevel->level_name : null,
                    'section' => $section ? $section->section_name : null,
                    'advisory_class' => $section && $section->gradeLevel
                        ? $section->gradeLevel->level_name . ' - ' . $section->section_name
                        : 'Not assigned'
                ],
                'students' => $students,
                'stats' => [
                    'total_students' => $totalStudents,
                    'clinic_visits_this_month' => $clinicVisitsThisMonth,
                    'students_with_allergies' => $studentsWithAllergies
                ]
            ];

            return $this->sendResponse($advisoryData, 'Advisory students retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve advisory students', $e->getMessage());
        }
    }
}
