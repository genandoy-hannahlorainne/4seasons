<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\BaseController;
use App\Models\User;
use App\Models\Section;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AdviserController extends BaseController
{
    /**
     * Get adviser profile information including advisory class
     */
    public function getProfile(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user || $user->role_id !== 3) {
                return $this->sendError('Unauthorized', 'User is not an adviser');
            }

            // Get adviser's assigned section
            $section = Section::with(['gradeLevel', 'schoolYear'])
                ->where('adviser_id', $user->user_id)
                ->where('is_active', true)
                ->first();

            $advisoryClass = 'Not assigned';
            $studentCount = 0;

            if ($section) {
                $advisoryClass = $section->gradeLevel->level_name . ' - ' . $section->section_name;
                $studentCount = Student::where('current_section_id', $section->id)
                    ->where('is_active', true)
                    ->count();
            }

            $profileData = [
                'user_id' => $user->user_id,
                'full_name' => $user->full_name,
                'email' => $user->email,
                'phone' => $user->phone,
                'employee_number' => $user->employee_number,
                'advisory_class' => $advisoryClass,
                'student_count' => $studentCount,
                'section_id' => $section ? $section->id : null,
                'grade_level' => $section && $section->gradeLevel ? $section->gradeLevel->level_name : null,
                'section_name' => $section ? $section->section_name : null,
                'school_year' => $section && $section->schoolYear ? $section->schoolYear->year_name : null
            ];

            return $this->sendResponse($profileData, 'Adviser profile retrieved successfully');
        } catch (\Exception $e) {
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
                'phone' => 'sometimes|nullable|string|max:20'
            ]);

            if ($validator->fails()) {
                return $this->sendError('Validation Error', $validator->errors()->first());
            }

            $updateData = [];
            if ($request->has('full_name')) {
                $updateData['full_name'] = $request->full_name;
            }
            if ($request->has('email')) {
                $updateData['email'] = $request->email;
            }
            if ($request->has('phone')) {
                $updateData['phone'] = $request->phone;
            }

            if (!empty($updateData)) {
                $user->update($updateData);
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
            
            if (!$user || $user->role_id !== 3) {
                return $this->sendError('Unauthorized', 'User is not an adviser');
            }

            // Get adviser's assigned section with students
            $section = Section::with(['gradeLevel', 'schoolYear', 'students' => function($query) {
                    $query->where('is_active', true);
                }])
                ->where('adviser_id', $user->user_id)
                ->where('is_active', true)
                ->first();

            $dashboardData = [
                'adviser' => [
                    'user_id' => $user->user_id,
                    'full_name' => $user->full_name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'employee_number' => $user->employee_number
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
                $students = $section->students;
                
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
                        'emergency_contact' => $student->emergency_contact_name,
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
            
            if (!$user || $user->role_id !== 3) {
                return $this->sendError('Unauthorized', 'User is not an adviser');
            }

            $days = $request->get('days', 7);
            $startDate = now()->subDays($days);

            // Get adviser's section
            $section = Section::with(['gradeLevel', 'schoolYear'])
                ->where('adviser_id', $user->user_id)
                ->where('is_active', true)
                ->first();

            if (!$section) {
                return $this->sendError('No section assigned to this adviser');
            }

            // Get students in the section
            $students = Student::where('current_section_id', $section->id)
                ->where('is_active', true)
                ->get();

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

            $heatmapData = [
                'advisory_class' => $section->gradeLevel->level_name . ' - ' . $section->section_name,
                'total_students' => $totalStudents,
                'visits_by_date' => array_reverse($visitsByDate), // Most recent first
                'trending_symptoms' => array_slice($trendingSymptoms, 0, 10), // Top 10
                'alerts' => $alerts,
                'period_days' => $days
            ];

            return $this->sendResponse($heatmapData, 'Health heatmap data retrieved successfully');
        } catch (\Exception $e) {
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
            
            if (!$user || $user->role_id !== 3) {
                return $this->sendError('Unauthorized', 'User is not an adviser');
            }

            $schoolYearId = $request->get('school_year_id');
            if (!$schoolYearId) {
                return $this->sendError('School year ID is required');
            }

            // Get adviser's section for the specified school year
            $section = Section::with(['gradeLevel', 'schoolYear'])
                ->where('adviser_id', $user->user_id)
                ->where('school_year_id', $schoolYearId)
                ->where('is_active', true)
                ->first();

            if (!$section) {
                return $this->sendError('No section assigned for this school year');
            }

            // Get students in the section
            $students = Student::with(['allergies', 'medicalVisits' => function($query) {
                    $query->orderBy('visit_datetime', 'desc')->limit(1);
                }])
                ->where('current_section_id', $section->id)
                ->where('is_active', true)
                ->orderBy('last_name')
                ->orderBy('first_name')
                ->get()
                ->map(function($student) {
                    $lastVisit = $student->medicalVisits->first();
                    return [
                        'student_id' => $student->student_id,
                        'student_number' => $student->student_number,
                        'first_name' => $student->first_name,
                        'last_name' => $student->last_name,
                        'full_name' => trim($student->first_name . ' ' . $student->last_name),
                        'gender' => $student->gender,
                        'birth_date' => $student->birth_date,
                        'blood_type' => $student->blood_type,
                        'emergency_contact' => $student->emergency_contact_name,
                        'emergency_contact_phone' => $student->emergency_contact_phone,
                        'allergies' => $student->allergies->pluck('allergy_name')->toArray(),
                        'last_visit' => $lastVisit ? [
                            'visit_id' => $lastVisit->visit_id,
                            'visit_date' => $lastVisit->visit_datetime->format('Y-m-d'),
                            'diagnosis' => $lastVisit->chief_complaint,
                            'status' => $lastVisit->status
                        ] : null,
                        'promotion_eligible' => true // Can be enhanced with business logic
                    ];
                });

            $rosterData = [
                'section' => [
                    'id' => $section->id,
                    'section_name' => $section->section_name,
                    'level_name' => $section->gradeLevel->level_name,
                    'level_number' => $section->gradeLevel->level_number,
                    'school_year' => $section->schoolYear->year_name,
                    'capacity' => $section->capacity
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
     * Get advisory students (current active students)
     */
    public function getAdvisoryStudents(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user || $user->role_id !== 3) {
                return $this->sendError('Unauthorized', 'User is not an adviser');
            }

            // Get adviser's current section
            $section = Section::with(['gradeLevel', 'schoolYear'])
                ->where('adviser_id', $user->user_id)
                ->where('is_active', true)
                ->first();

            if (!$section) {
                return $this->sendError('No active section assigned to this adviser');
            }

            // Get students with medical data
            $students = Student::with(['allergies', 'medicalVisits' => function($query) {
                    $query->orderBy('visit_datetime', 'desc')->limit(5);
                }])
                ->where('current_section_id', $section->id)
                ->where('is_active', true)
                ->get()
                ->map(function($student) {
                    return [
                        'student_id' => $student->student_id,
                        'student_number' => $student->student_number,
                        'first_name' => $student->first_name,
                        'middle_name' => $student->middle_name,
                        'last_name' => $student->last_name,
                        'full_name' => trim($student->first_name . ' ' . $student->middle_name . ' ' . $student->last_name),
                        'birth_date' => $student->birth_date,
                        'gender' => $student->gender,
                        'grade_level' => $section->gradeLevel->level_name,
                        'section' => $section->section_name,
                        'grade_section' => $section->gradeLevel->level_name . ' - ' . $section->section_name,
                        'blood_type' => $student->blood_type,
                        'emergency_contact' => $student->emergency_contact_name,
                        'email' => $student->email,
                        'phone' => $student->phone,
                        'allergies' => $student->allergies->pluck('allergy_name')->toArray(),
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
                    'grade_level' => $section->gradeLevel->level_name,
                    'section' => $section->section_name,
                    'advisory_class' => $section->gradeLevel->level_name . ' - ' . $section->section_name
                ],
                'students' => $students,
                'stats' => [
                    'total_students' => $students->count(),
                    'clinic_visits_this_month' => $students->sum(function($student) {
                        return \App\Models\MedicalVisit::where('student_id', $student['student_id'])
                            ->where('visit_datetime', '>=', now()->startOfMonth())
                            ->count();
                    }),
                    'students_with_allergies' => $students->filter(function($student) {
                        return count($student['allergies']) > 0;
                    })->count()
                ]
            ];

            return $this->sendResponse($advisoryData, 'Advisory students retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve advisory students', $e->getMessage());
        }
    }
}