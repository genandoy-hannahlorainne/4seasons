<?php

namespace App\Http\Controllers\Api;

use App\Models\Student;
use App\Models\MedicalVisit;
use App\Models\User;
use App\Models\Allergy;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends BaseController
{
    /**
     * Get admin dashboard statistics
     */
    public function getAdminStats(Request $request)
    {
        try {
            $days = $request->get('days', 30); // Default to last 30 days
            $startDate = now()->subDays($days);

            $stats = [
                // User statistics
                'total_users' => User::where('is_active', true)->count(),
                'total_students' => Student::where('is_active', true)->count(),
                'total_advisers' => User::whereHas('role', function($q) {
                    $q->where('role_name', 'Adviser');
                })->where('is_active', true)->count(),
                'total_staff' => User::whereHas('role', function($q) {
                    $q->where('role_name', 'Clinic Staff');
                })->where('is_active', true)->count(),

                // Medical visit statistics
                'total_visits' => MedicalVisit::where('visit_datetime', '>=', $startDate)->count(),
                'emergency_visits' => MedicalVisit::where('visit_datetime', '>=', $startDate)
                                                ->where('visit_type', 'Emergency')->count(),
                'visits_today' => MedicalVisit::whereDate('visit_datetime', today())->count(),
                'visits_this_week' => MedicalVisit::where('visit_datetime', '>=', now()->startOfWeek())->count(),

                // Health statistics
                'students_with_allergies' => Student::whereHas('allergies')->count(),
                'students_with_conditions' => Student::whereHas('medicalHistory', function($q) {
                    $q->where(function($query) {
                        $query->where('condition_asthma', true)
                              ->orWhere('condition_diabetes', true)
                              ->orWhere('condition_heart_problem', true)
                              ->orWhere('condition_hypertension', true)
                              ->orWhere('condition_seizure_disorder', true)
                              ->orWhere('condition_bleeding_disorder', true)
                              ->orWhere('condition_kidney_disease', true)
                              ->orWhere('condition_mental_health', true);
                    });
                })->count(),

                // Recent activity
                'recent_visits' => MedicalVisit::with(['student.user', 'clinicStaff.user'])
                                             ->orderBy('visit_datetime', 'desc')
                                             ->limit(5)
                                             ->get(),

                // Charts data
                'visits_by_day' => MedicalVisit::where('visit_datetime', '>=', $startDate)
                                             ->groupBy(DB::raw('DATE(visit_datetime)'))
                                             ->selectRaw('DATE(visit_datetime) as date, count(*) as count')
                                             ->orderBy('date')
                                             ->get(),

                'visits_by_type' => MedicalVisit::where('visit_datetime', '>=', $startDate)
                                                ->groupBy('visit_type')
                                                ->selectRaw('visit_type, count(*) as count')
                                                ->pluck('count', 'visit_type'),

                'grade_distribution' => Student::where('is_active', true)
                                              ->groupBy('grade_level')
                                              ->selectRaw('grade_level, count(*) as count')
                                              ->orderBy('grade_level')
                                              ->pluck('count', 'grade_level')
            ];

            return $this->sendResponse($stats, 'Admin dashboard statistics retrieved successfully');

        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve admin statistics', [
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get adviser dashboard statistics
     */
    public function getAdviserStats(Request $request)
    {
        try {
            $user = $request->user();

            // Get adviser's students
            $adviser = $user->adviser;
            if (!$adviser) {
                return $this->sendError('User is not an adviser', [], 403);
            }

            $students = Student::where('current_adviser_id', $adviser->adviser_id)
                             ->where('is_active', true)
                             ->get();

            $studentIds = $students->pluck('student_id');

            $days = $request->get('days', 30);
            $startDate = now()->subDays($days);

            $stats = [
                'total_students' => $students->count(),
                'students_with_allergies' => $students->filter(function($student) {
                    return $student->allergies()->exists();
                })->count(),
                'students_with_conditions' => $students->filter(function($student) {
                    return $student->medicalHistory && $student->medicalHistory->hasConditions();
                })->count(),
                'recent_visits' => MedicalVisit::whereIn('student_id', $studentIds)
                                             ->where('visit_datetime', '>=', $startDate)
                                             ->count(),
                'emergency_visits' => MedicalVisit::whereIn('student_id', $studentIds)
                                                ->where('visit_datetime', '>=', $startDate)
                                                ->where('visit_type', 'Emergency')
                                                ->count(),
                // Note: is_emergency and follow_up_required columns don't exist in actual database
                // Using visit_type = 'Emergency' for emergency detection
                'students_needing_attention' => $students->filter(function($student) {
                    // Students with recent emergency visits
                    return $student->medicalVisits()
                                 ->where('visit_datetime', '>=', now()->subDays(7))
                                 ->where('visit_type', 'Emergency')
                                 ->exists();
                })->count(),
                'grade_sections' => $students->groupBy(['grade_level', 'section'])
                                           ->map(function($gradeStudents, $grade) {
                                               return $gradeStudents->map(function($sectionStudents) {
                                                   return $sectionStudents->count();
                                               });
                                           }),
                'recent_student_visits' => MedicalVisit::with(['student.user', 'clinicStaff.user'])
                                                     ->whereIn('student_id', $studentIds)
                                                     ->orderBy('visit_datetime', 'desc')
                                                     ->limit(10)
                                                     ->get()
            ];

            return $this->sendResponse($stats, 'Adviser dashboard statistics retrieved successfully');

        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve adviser statistics', [
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get clinic staff dashboard statistics
     */
    public function getStaffStats(Request $request)
    {
        try {
            $user = $request->user();

            // Verify user is clinic staff
            $clinicStaff = $user->clinicStaff;
            if (!$clinicStaff) {
                return $this->sendError('User is not clinic staff', [], 403);
            }

            $days = $request->get('days', 30);
            $startDate = now()->subDays($days);

            $stats = [
                // Overall statistics
                'total_visits_handled' => MedicalVisit::where('clinic_staff_id', $clinicStaff->clinic_staff_id)
                                                    ->where('visit_datetime', '>=', $startDate)
                                                    ->count(),
                'visits_today' => MedicalVisit::where('clinic_staff_id', $clinicStaff->clinic_staff_id)
                                             ->whereDate('visit_datetime', today())
                                             ->count(),
                'emergency_visits_handled' => MedicalVisit::where('clinic_staff_id', $clinicStaff->clinic_staff_id)
                                                        ->where('visit_datetime', '>=', $startDate)
                                                        ->where('visit_type', 'Emergency')
                                                        ->count(),
                // Note: follow_up_required column doesn't exist in actual database
                // Using Open status visits as pending visits instead
                'pending_visits' => MedicalVisit::where('status', 'Open')->count(),

                // Recent activity
                'recent_visits' => MedicalVisit::with(['student.user'])
                                             ->where('clinic_staff_id', $clinicStaff->clinic_staff_id)
                                             ->orderBy('visit_datetime', 'desc')
                                             ->limit(10)
                                             ->get(),

                // Students with frequent visits
                'frequent_visitors' => MedicalVisit::with(['student.user'])
                                                 ->where('clinic_staff_id', $clinicStaff->clinic_staff_id)
                                                 ->where('visit_datetime', '>=', $startDate)
                                                 ->groupBy('student_id')
                                                 ->selectRaw('student_id, count(*) as visit_count')
                                                 ->having('visit_count', '>=', 3)
                                                 ->orderBy('visit_count', 'desc')
                                                 ->limit(10)
                                                 ->get(),

                // Visit patterns
                'visits_by_type' => MedicalVisit::where('clinic_staff_id', $clinicStaff->clinic_staff_id)
                                                ->where('visit_datetime', '>=', $startDate)
                                                ->groupBy('visit_type')
                                                ->selectRaw('visit_type, count(*) as count')
                                                ->pluck('count', 'visit_type'),

                'daily_visits' => MedicalVisit::where('clinic_staff_id', $clinicStaff->clinic_staff_id)
                                             ->where('visit_datetime', '>=', $startDate)
                                             ->groupBy(DB::raw('DATE(visit_datetime)'))
                                             ->selectRaw('DATE(visit_datetime) as date, count(*) as count')
                                             ->orderBy('date')
                                             ->get()
            ];

            return $this->sendResponse($stats, 'Staff dashboard statistics retrieved successfully');

        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve staff statistics', [
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get student dashboard information
     */
    public function getStudentStats(Request $request)
    {
        try {
            $user = $request->user();

            // Get student record
            $student = $user->student;
            if (!$student) {
                return $this->sendError('User is not a student', [], 403);
            }

            $stats = [
                'student_info' => [
                    'student_id' => $student->student_id,
                    'student_number' => $student->student_number,
                    'full_name' => $student->full_name,
                    'grade_level' => $student->grade_level,
                    'section' => $student->section,
                    'blood_type' => $student->blood_type,
                    'height_cm' => $student->height_cm,
                    'weight_kg' => $student->weight_kg,
                    'bmi' => $student->bmi,
                    'bmi_category' => $student->bmi_category
                ],
                'medical_summary' => [
                    'total_visits' => $student->medicalVisits()->count(),
                    'recent_visits' => $student->medicalVisits()
                                             ->with(['clinicStaff.user', 'vitals'])
                                             ->orderBy('visit_datetime', 'desc')
                                             ->limit(5)
                                             ->get(),
                    'allergies' => $student->allergies,
                    'medical_history' => $student->medicalHistory,
                    // Note: follow_up_required and follow_up_date columns don't exist in actual database
                    'upcoming_follow_ups' => []
                ],
                'health_alerts' => [
                    'has_allergies' => $student->allergies()->exists(),
                    'has_conditions' => $student->medicalHistory && $student->medicalHistory->hasConditions(),
                    // Note: follow_up_required column doesn't exist in actual database
                    'needs_follow_up' => false
                ]
            ];

            return $this->sendResponse($stats, 'Student dashboard information retrieved successfully');

        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve student information', [
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get clinic staff reports and analytics data
     */
    public function getStaffReportsAnalytics(Request $request)
    {
        try {
            $startDate = $request->get('start_date', now()->subDays(30)->toDateString());
            $endDate = $request->get('end_date', now()->toDateString());
            $gradeFilter = $request->get('grade_level');

            $baseQuery = DB::table('medical_visits as mv')
                ->leftJoin('students as s', 'mv.student_id', '=', 's.student_id')
                ->whereBetween(DB::raw('DATE(mv.visit_datetime)'), [$startDate, $endDate]);

            if (!empty($gradeFilter)) {
                $baseQuery->where(function ($query) use ($gradeFilter) {
                    $query->where('s.grade_level', $gradeFilter)
                        ->orWhere('s.grade_level', 'Grade ' . $gradeFilter);
                });
            }

            $totalVisits = (clone $baseQuery)->count();
            $uniqueStudents = (clone $baseQuery)->distinct('mv.student_id')->count('mv.student_id');
            $emergencyCases = (clone $baseQuery)
                ->whereRaw('LOWER(COALESCE(mv.visit_type, "")) = ?', ['emergency'])
                ->count();
            $referrals = (clone $baseQuery)
                ->whereRaw('LOWER(COALESCE(mv.status, "")) = ?', ['referred'])
                ->count();

            $casesByIllness = (clone $baseQuery)
                ->selectRaw(
                    'COALESCE(NULLIF(TRIM(mv.chief_complaint), ""), NULLIF(TRIM(mv.notes), ""), "Unspecified") as illness, COUNT(*) as count'
                )
                ->groupBy('illness')
                ->orderByDesc('count')
                ->limit(10)
                ->get()
                ->map(function ($row) {
                    return [
                        'illness' => $row->illness,
                        'count' => (int)$row->count,
                    ];
                })
                ->values();

            $casesByGrade = (clone $baseQuery)
                ->selectRaw('s.grade_level as grade, COUNT(*) as count')
                ->whereNotNull('s.grade_level')
                ->groupBy('s.grade_level')
                ->orderBy('s.grade_level')
                ->get()
                ->map(function ($row) {
                    $gradeRaw = (string)$row->grade;
                    preg_match('/\d+/', $gradeRaw, $matches);
                    $gradeNumber = isset($matches[0]) ? (int)$matches[0] : (int)$gradeRaw;

                    return [
                        'grade' => $gradeNumber,
                        'count' => (int)$row->count,
                    ];
                })
                ->filter(function ($row) {
                    return $row['grade'] > 0;
                })
                ->values();

            return $this->sendResponse([
                'totalVisits' => (int)$totalVisits,
                'uniqueStudents' => (int)$uniqueStudents,
                'emergencyCases' => (int)$emergencyCases,
                'referrals' => (int)$referrals,
                'casesByIllness' => $casesByIllness,
                'casesByGrade' => $casesByGrade,
            ], 'Staff reports analytics retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve staff reports analytics', [
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get clinic dashboard overview statistics
     */
    public function getClinicOverview(Request $request)
    {
        try {
            $today = now()->startOfDay();

            // Get overall statistics (not per staff member)
            $stats = [
                'total_students' => Student::where('is_active', true)->count(),
                'today_visits' => MedicalVisit::whereDate('visit_datetime', $today)->count(),
                'total_visits' => MedicalVisit::count(),
                'pending_visits' => MedicalVisit::where('status', 'Open')->count(),

                // Recent visits (last 5)
                'recent_visits' => MedicalVisit::with(['student'])
                    ->orderBy('visit_datetime', 'desc')
                    ->limit(5)
                    ->get()
                    ->map(function($visit) {
                        $student = $visit->student;
                        return [
                            'visit_id' => $visit->visit_id,
                            'student_name' => $student ? trim($student->first_name . ' ' . $student->last_name) : 'Unknown',
                            'student_id' => $visit->student_id,
                            'diagnosis' => $visit->chief_complaint ?: $visit->notes ?: 'No complaint recorded',
                            'status' => strtolower($visit->status),
                            'visit_datetime' => $visit->visit_datetime,
                            'date_time' => $visit->visit_datetime->format('M j, g:i A'),
                            'avatar' => '/assets/user-' . ($student && $student->gender === 'F' ? 'female' : 'male') . '.png'
                        ];
                    }),

                // Students with allergies
                'students_with_allergies' => Student::with(['allergies'])
                    ->whereHas('allergies')
                    ->where('is_active', true)
                    ->limit(10)
                    ->get()
                    ->map(function($student) {
                        return [
                            'student_id' => $student->student_id,
                            'name' => trim($student->first_name . ' ' . $student->last_name),
                            'allergies' => $student->allergies->pluck('allergy_name')->filter()->toArray()
                        ];
                    })
            ];

            return $this->sendResponse($stats, 'Clinic dashboard overview retrieved successfully');

        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve clinic overview', [
                'error' => $e->getMessage()
            ], 500);
        }
    }
    public function getStaffProfile(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user) return $this->sendError('Unauthorized', 'Not authenticated');

            $user->load('role');
            $staff = \App\Models\ClinicStaff::where('user_id', $user->user_id)->first();

            return $this->sendResponse([
                'user_id'    => $user->user_id,
                'full_name'  => $user->full_name,
                'email'      => $user->email,
                'phone'      => $user->phone,
                'staff_code' => $staff?->staff_code,
                'position'   => $staff?->position ?? 'Clinic Staff',
            ], 'Staff profile retrieved successfully');
        } catch (\Throwable $e) {
            return $this->sendError('Failed to retrieve staff profile', $e->getMessage());
        }
    }

    public function updateStaffProfile(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user || strtolower($user->role?->role_name ?? '') !== 'clinic_staff') {
                return $this->sendError('Unauthorized', 'User is not clinic staff');
            }

            $validated = $request->validate([
                'email'      => 'sometimes|email|max:255|unique:users,email,' . $user->user_id . ',user_id',
                'phone'      => 'sometimes|nullable|string|max:20',
                'staff_code' => 'sometimes|nullable|string|max:20',
            ]);

            $userUpdate = [];
            if (isset($validated['email']))  $userUpdate['email'] = $validated['email'];
            if (isset($validated['phone']))  $userUpdate['phone'] = $validated['phone'];
            if (!empty($userUpdate)) $user->update($userUpdate);

            if (isset($validated['staff_code'])) {
                \App\Models\ClinicStaff::where('user_id', $user->user_id)
                    ->update(['staff_code' => $validated['staff_code']]);
            }

            return $this->sendResponse($user->fresh(), 'Profile updated successfully');
        } catch (\Throwable $e) {
            return $this->sendError('Failed to update profile', $e->getMessage());
        }
    }
}
