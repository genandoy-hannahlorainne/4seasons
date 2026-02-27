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
                                                ->where('is_emergency', true)->count(),
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
                                                ->where('is_emergency', true)
                                                ->count(),
                'students_needing_attention' => $students->filter(function($student) {
                    // Students with recent emergency visits or follow-ups
                    return $student->medicalVisits()
                                 ->where('visit_datetime', '>=', now()->subDays(7))
                                 ->where(function($q) {
                                     $q->where('is_emergency', true)
                                       ->orWhere('follow_up_required', true);
                                 })->exists();
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
                                                        ->where('is_emergency', true)
                                                        ->count(),
                'follow_ups_required' => MedicalVisit::where('clinic_staff_id', $clinicStaff->clinic_staff_id)
                                                   ->where('follow_up_required', true)
                                                   ->where('status', 'active')
                                                   ->count(),
                
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
                    'upcoming_follow_ups' => $student->medicalVisits()
                                                   ->where('follow_up_required', true)
                                                   ->where('follow_up_date', '>=', today())
                                                   ->orderBy('follow_up_date')
                                                   ->get()
                ],
                'health_alerts' => [
                    'has_allergies' => $student->allergies()->exists(),
                    'has_conditions' => $student->medicalHistory && $student->medicalHistory->hasConditions(),
                    'needs_follow_up' => $student->medicalVisits()
                                               ->where('follow_up_required', true)
                                               ->where('follow_up_date', '>=', today())
                                               ->exists()
                ]
            ];
            
            return $this->sendResponse($stats, 'Student dashboard information retrieved successfully');
            
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve student information', [
                'error' => $e->getMessage()
            ], 500);
        }
    }
}