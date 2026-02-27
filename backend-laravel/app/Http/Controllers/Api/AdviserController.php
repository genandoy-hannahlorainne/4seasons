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
}