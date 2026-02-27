<?php

namespace App\Http\Controllers\Api;

use App\Models\Student;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StudentController extends BaseController
{
    /**
     * Display a listing of students
     */
    public function index(Request $request)
    {
        try {
            $query = Student::with(['user', 'medicalHistory', 'allergies'])
                           ->where('is_active', true);
            
            // Add search functionality
            if ($request->has('search')) {
                $search = $request->get('search');
                $query->where(function($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhere('student_number', 'like', "%{$search}%");
                });
            }
            
            // Add grade level filter
            if ($request->has('grade_level')) {
                $query->where('grade_level', $request->get('grade_level'));
            }
            
            // Add section filter
            if ($request->has('section')) {
                $query->where('section', $request->get('section'));
            }
            
            $students = $query->orderBy('last_name')
                            ->orderBy('first_name')
                            ->paginate(20);
            
            return $this->sendResponse($students, 'Students retrieved successfully');
            
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve students', [
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified student
     */
    public function show(Student $student)
    {
        try {
            $student->load([
                'user',
                'medicalHistory',
                'allergies',
                'medicalVisits' => function($query) {
                    $query->with('vitals')->orderBy('visit_datetime', 'desc')->limit(10);
                }
            ]);
            
            return $this->sendResponse($student, 'Student retrieved successfully');
            
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve student', [
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified student profile
     */
    public function update(Request $request, Student $student)
    {
        try {
            $request->validate([
                'first_name' => 'sometimes|required|string|max:80',
                'last_name' => 'sometimes|required|string|max:80',
                'middle_name' => 'sometimes|nullable|string|max:80',
                'birth_date' => 'sometimes|nullable|date',
                'gender' => 'sometimes|in:M,F,Other',
                'address' => 'sometimes|nullable|string',
                'blood_type' => 'sometimes|nullable|string|max:5',
                'emergency_contact' => 'sometimes|nullable|string|max:150',
                'height_cm' => 'sometimes|nullable|numeric|min:50|max:250',
                'weight_kg' => 'sometimes|nullable|numeric|min:10|max:200'
            ]);

            DB::transaction(function () use ($request, $student) {
                // Update student data
                $student->update($request->only([
                    'first_name', 'last_name', 'middle_name', 'birth_date',
                    'gender', 'address', 'blood_type', 'emergency_contact',
                    'height_cm', 'weight_kg'
                ]));

                // Calculate BMI if height and weight are provided
                if ($student->height_cm && $student->weight_kg) {
                    $heightM = $student->height_cm / 100;
                    $bmi = round($student->weight_kg / ($heightM * $heightM), 2);
                    
                    $bmiCategory = 'Normal weight';
                    if ($bmi < 18.5) $bmiCategory = 'Underweight';
                    elseif ($bmi >= 25 && $bmi < 30) $bmiCategory = 'Overweight';
                    elseif ($bmi >= 30) $bmiCategory = 'Obese';
                    
                    $student->update([
                        'bmi' => $bmi,
                        'bmi_category' => $bmiCategory,
                        'last_physical_update' => now()
                    ]);
                }

                // Update user data if provided
                if ($student->user && $request->has(['full_name', 'email', 'phone'])) {
                    $student->user->update($request->only(['full_name', 'email', 'phone']));
                }
            });

            // Reload student with relationships
            $student->load(['user', 'medicalHistory', 'allergies']);

            return $this->sendResponse($student, 'Student updated successfully');

        } catch (\Exception $e) {
            return $this->sendError('Failed to update student', [
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get student medical data
     */
    public function getMedicalData(Student $student)
    {
        try {
            $student->load([
                'medicalHistory',
                'allergies',
                'currentAdviser',
                'medicalVisits' => function($query) {
                    $query->with(['vitals', 'clinicStaff.user'])
                          ->orderBy('visit_datetime', 'desc')
                          ->limit(20);
                }
            ]);

            $medicalData = [
                'student_info' => [
                    'student_id' => $student->student_id,
                    'student_number' => $student->student_number,
                    'full_name' => $student->full_name,
                    'birth_date' => $student->birth_date,
                    'blood_type' => $student->blood_type,
                    'height_cm' => $student->height_cm,
                    'weight_kg' => $student->weight_kg,
                    'bmi' => $student->bmi,
                    'bmi_category' => $student->bmi_category
                ],
                'personal_info' => [
                    'student_id' => $student->student_id,
                    'student_number' => $student->student_number,
                    'full_name' => $student->full_name,
                    'birth_date' => $student->birth_date,
                    'gender' => $student->gender,
                    'blood_type' => $student->blood_type,
                    'address' => $student->address,
                    'emergency_contact' => $student->emergency_contact,
                    'grade_level' => $student->grade_level,
                    'section' => $student->section,
                    'adviser_name' => $student->currentAdviser ? $student->currentAdviser->full_name : null,
                    'adviser_contact' => $student->currentAdviser ? $student->currentAdviser->phone : null,
                    'height_cm' => $student->height_cm,
                    'weight_kg' => $student->weight_kg,
                    'bmi' => $student->bmi,
                    'bmi_category' => $student->bmi_category
                ],
                'medical_history' => $student->medicalHistory,
                'allergies' => $student->allergies,
                'recent_visits' => $student->medicalVisits
            ];

            return $this->sendResponse($medicalData, 'Student medical data retrieved successfully');

        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve medical data', [
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update student physical information
     */
    public function updatePhysicalInfo(Request $request, Student $student)
    {
        try {
            $request->validate([
                'height_cm' => 'required|numeric|min:50|max:250',
                'weight_kg' => 'required|numeric|min:10|max:200',
                'blood_type' => 'nullable|string|max:5'
            ]);

            // Calculate BMI
            $heightM = $request->height_cm / 100;
            $bmi = round($request->weight_kg / ($heightM * $heightM), 2);
            
            $bmiCategory = 'Normal weight';
            if ($bmi < 18.5) $bmiCategory = 'Underweight';
            elseif ($bmi >= 25 && $bmi < 30) $bmiCategory = 'Overweight';
            elseif ($bmi >= 30) $bmiCategory = 'Obese';

            $student->update([
                'height_cm' => $request->height_cm,
                'weight_kg' => $request->weight_kg,
                'blood_type' => $request->blood_type,
                'bmi' => $bmi,
                'bmi_category' => $bmiCategory,
                'last_physical_update' => now()
            ]);

            return $this->sendResponse([
                'height_cm' => $student->height_cm,
                'weight_kg' => $student->weight_kg,
                'blood_type' => $student->blood_type,
                'bmi' => $student->bmi,
                'bmi_category' => $student->bmi_category,
                'last_physical_update' => $student->last_physical_update
            ], 'Physical information updated successfully');

        } catch (\Exception $e) {
            return $this->sendError('Failed to update physical information', [
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Search students by name or student number
     */
    public function search(Request $request)
    {
        try {
            $query = $request->get('q', '');
            
            if (strlen($query) < 2) {
                return $this->sendResponse([], 'Search query too short');
            }
            
            $students = Student::with(['user'])
                             ->where('is_active', true)
                             ->whereNull('deleted_at')
                             ->where(function($q) use ($query) {
                                 $q->where('student_number', 'LIKE', "%{$query}%")
                                   ->orWhere('first_name', 'LIKE', "%{$query}%")
                                   ->orWhere('last_name', 'LIKE', "%{$query}%")
                                   ->orWhereHas('user', function($userQuery) use ($query) {
                                       $userQuery->where('full_name', 'LIKE', "%{$query}%");
                                   });
                             })
                             ->limit(10)
                             ->get();
            
            $formattedStudents = $students->map(function($student) {
                return [
                    'student_id' => $student->student_id,
                    'student_number' => $student->student_number,
                    'full_name' => $student->user->full_name ?? ($student->first_name . ' ' . $student->last_name),
                    'grade_section' => $student->grade_level . ' - ' . $student->section,
                    'grade_level' => $student->grade_level,
                    'section' => $student->section,
                    'emergency_contact' => $student->emergency_contact,
                    'emergency_contact_phone' => $student->emergency_contact_phone,
                    'allergies' => $student->allergies ? $student->allergies->pluck('allergy_text')->toArray() : [],
                    'avatar' => '/assets/user-' . strtolower($student->gender) . '.png'
                ];
            });
            
            return $this->sendResponse($formattedStudents, 'Students found successfully');
            
        } catch (\Exception $e) {
            return $this->sendError('Failed to search students', [
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get student by QR code (student_id or student_number)
     */
    public function getByQr(Request $request)
    {
        try {
            $studentId = $request->get('student_id');
            $studentNumber = $request->get('student_number');
            
            if (!$studentId && !$studentNumber) {
                return $this->sendError('Student ID or student number is required', [], 400);
            }
            
            $query = Student::with(['user', 'allergies']);
            
            if ($studentId) {
                $query->where('student_id', $studentId);
            } else {
                $query->where('student_number', $studentNumber);
            }
            
            $student = $query->where('is_active', true)
                           ->whereNull('deleted_at')
                           ->first();
            
            if (!$student) {
                return $this->sendError('Student not found', [], 404);
            }
            
            $studentData = [
                'student_id' => $student->student_id,
                'student_number' => $student->student_number,
                'full_name' => $student->user->full_name ?? ($student->first_name . ' ' . $student->last_name),
                'grade_section' => $student->grade_level . ' - ' . $student->section,
                'grade_level' => $student->grade_level,
                'section' => $student->section,
                'emergency_contact' => $student->emergency_contact,
                'emergency_contact_phone' => $student->emergency_contact_phone,
                'parentPhone' => $student->emergency_contact_phone,
                'allergies' => $student->allergies ? $student->allergies->pluck('allergy_text')->toArray() : [],
                'avatar' => '/assets/user-' . strtolower($student->gender) . '.png',
                'clearance' => [
                    'level' => $student->general_clearance_status === 'cleared' ? 'green' : 
                              ($student->requires_special_clearance ? 'red' : 'yellow'),
                    'message' => $student->clearance_notes ?? 'Medical clearance status normal'
                ]
            ];
            
            return $this->sendResponse($studentData, 'Student found successfully');
            
        } catch (\Exception $e) {
            return $this->sendError('Failed to get student information', [
                'error' => $e->getMessage()
            ], 500);
        }
    }
}