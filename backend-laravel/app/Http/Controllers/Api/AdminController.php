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
                        'email' => $request->email
                    ];
                    
                    Mail::to($request->email)->send(new UserAccountCreated($emailData, $tempPassword, 'student'));
                } catch (\Exception $emailError) {
                    // Log email error but don't fail the user creation
                    \Log::error('Failed to send account creation email: ' . $emailError->getMessage());
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
     * Generate temporary password
     */
    private function generateTempPassword()
    {
        $uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $lowercase = 'abcdefghijklmnopqrstuvwxyz';
        $numbers = '0123456789';
        
        $password = '';
        $password .= $uppercase[rand(0, strlen($uppercase) - 1)];
        $password .= $lowercase[rand(0, strlen($lowercase) - 1)];
        $password .= $numbers[rand(0, strlen($numbers) - 1)];
        
        $allChars = $uppercase . $lowercase . $numbers;
        for ($i = 0; $i < 5; $i++) {
            $password .= $allChars[rand(0, strlen($allChars) - 1)];
        }
        
        return str_shuffle($password);
    }
}