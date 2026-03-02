<?php

namespace App\Http\Controllers\Api;

use App\Models\Allergy;
use App\Models\MedicalHistory;
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
                'emergency_contact_relation' => 'sometimes|nullable|string|max:100',
                'emergency_contact_phone' => 'sometimes|nullable|string|max:20',
                'height_cm' => 'sometimes|nullable|numeric|min:50|max:250',
                'weight_kg' => 'sometimes|nullable|numeric|min:10|max:200',
                'full_name' => 'sometimes|nullable|string|max:150',
                'email' => 'sometimes|nullable|email|max:100',
                'phone' => 'sometimes|nullable|string|max:20'
            ]);

            DB::transaction(function () use ($request, $student) {
                $studentUpdateData = $this->extractPresent($request, [
                    'first_name', 'last_name', 'middle_name', 'birth_date',
                    'gender', 'address', 'blood_type', 'emergency_contact',
                    'emergency_contact_relation', 'emergency_contact_phone',
                    'height_cm', 'weight_kg'
                ]);

                if (!empty($studentUpdateData)) {
                    $student->update($studentUpdateData);
                }

                if ($request->exists('height_cm') || $request->exists('weight_kg')) {
                    $height = $request->exists('height_cm') ? $request->input('height_cm') : $student->height_cm;
                    $weight = $request->exists('weight_kg') ? $request->input('weight_kg') : $student->weight_kg;

                    $bmiData = $this->buildBmiUpdateData($height, $weight);
                    $bmiData['last_physical_update'] = now();
                    $student->update($bmiData);
                }

                if ($student->user) {
                    $userUpdateData = $this->extractPresent($request, ['full_name', 'email', 'phone']);
                    if (!empty($userUpdateData)) {
                        $student->user->update($userUpdateData);
                    }
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
                'currentSection.adviser',
                'medicalVisits' => function($query) {
                    $query->with(['vitals', 'clinicStaff.user'])
                          ->orderBy('visit_datetime', 'desc')
                          ->limit(20);
                }
            ]);

            $resolvedAdviser = $student->currentAdviser ?: ($student->currentSection ? $student->currentSection->adviser : null);

            // Calculate visit statistics
            $totalVisits = $student->medicalVisits()->count();
            $recentVisits = $student->medicalVisits()
                                  ->where('visit_datetime', '>=', now()->subDays(30))
                                  ->count();

            $medicalData = [
                'personal_info' => [
                    'student_id' => $student->student_id,
                    'student_number' => $student->student_number,
                    'full_name' => $student->full_name,
                    'birth_date' => $student->birth_date,
                    'gender' => $student->gender,
                    'blood_type' => $student->blood_type,
                    'address' => $student->address,
                    'emergency_contact' => $student->emergency_contact,
                    'emergency_contact_relation' => $student->emergency_contact_relation,
                    'emergency_contact_phone' => $student->emergency_contact_phone,
                    'grade_level' => $student->grade_level,
                    'section' => $student->section,
                    'adviser_name' => $resolvedAdviser ? $resolvedAdviser->full_name : null,
                    'adviser_contact' => $resolvedAdviser ? $resolvedAdviser->phone : null,
                    'height_cm' => $student->height_cm,
                    'weight_kg' => $student->weight_kg,
                    'bmi' => $student->bmi,
                    'bmi_category' => $student->bmi_category
                ],
                'allergies' => $student->allergies,
                'recent_visits_count' => $recentVisits,
                'total_visits_count' => $totalVisits,
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
                'height_cm' => 'sometimes|nullable|numeric|min:50|max:250',
                'weight_kg' => 'sometimes|nullable|numeric|min:10|max:200',
                'blood_type' => 'sometimes|nullable|string|max:5'
            ]);

            if (!$request->exists('height_cm') && !$request->exists('weight_kg') && !$request->exists('blood_type')) {
                return $this->sendError('No fields provided for update', [], 422);
            }

            DB::transaction(function () use ($request, $student) {
                $updateData = $this->extractPresent($request, ['height_cm', 'weight_kg', 'blood_type']);

                $height = array_key_exists('height_cm', $updateData) ? $updateData['height_cm'] : $student->height_cm;
                $weight = array_key_exists('weight_kg', $updateData) ? $updateData['weight_kg'] : $student->weight_kg;

                if (array_key_exists('height_cm', $updateData) || array_key_exists('weight_kg', $updateData)) {
                    $updateData = array_merge($updateData, $this->buildBmiUpdateData($height, $weight));
                    $updateData['last_physical_update'] = now();
                }

                $student->update($updateData);
            });

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
     * Update section-based medical data without overwriting untouched fields
     */
    public function updateMedicalData(Request $request, Student $student)
    {
        try {
            $request->validate([
                'personal_info' => 'sometimes|array',
                'personal_info.address' => 'sometimes|nullable|string',
                'personal_info.emergency_contact' => 'sometimes|nullable|string|max:150',
                'personal_info.emergency_contact_relation' => 'sometimes|nullable|string|max:100',
                'personal_info.emergency_contact_phone' => 'sometimes|nullable|string|max:20',
                'personal_info.blood_type' => 'sometimes|nullable|string|max:5',
                'personal_info.phone' => 'sometimes|nullable|string|max:20',
                'personal_info.email' => 'sometimes|nullable|email|max:100',

                'physical_info' => 'sometimes|array',
                'physical_info.height_cm' => 'sometimes|nullable|numeric|min:50|max:250',
                'physical_info.weight_kg' => 'sometimes|nullable|numeric|min:10|max:200',
                'physical_info.blood_type' => 'sometimes|nullable|string|max:5',

                'medical_history' => 'sometimes|array',
                'medical_history.condition_asthma' => 'sometimes|boolean',
                'medical_history.condition_diabetes' => 'sometimes|boolean',
                'medical_history.condition_heart_problem' => 'sometimes|boolean',
                'medical_history.condition_hypertension' => 'sometimes|boolean',
                'medical_history.condition_seizure_disorder' => 'sometimes|boolean',
                'medical_history.condition_bleeding_disorder' => 'sometimes|boolean',
                'medical_history.condition_kidney_disease' => 'sometimes|boolean',
                'medical_history.condition_mental_health' => 'sometimes|boolean',
                'medical_history.other_conditions' => 'sometimes|nullable|string',
                'medical_history.current_medications' => 'sometimes|nullable|string',
                'medical_history.family_medical_history' => 'sometimes|nullable|string',
                'medical_history.notes' => 'sometimes|nullable|string',

                'allergies' => 'sometimes|array',
                'allergies.*.allergy_name' => 'required_with:allergies|string|max:100',
                'allergies.*.severity' => 'sometimes|nullable|in:mild,moderate,severe',
                'allergies.*.reaction_description' => 'sometimes|nullable|string',
                'allergies.*.treatment_notes' => 'sometimes|nullable|string'
            ]);

            DB::transaction(function () use ($request, $student) {
                if ($request->exists('personal_info')) {
                    $personal = $request->input('personal_info', []);

                    $studentUpdateData = $this->extractPresentFromArray($personal, [
                        'address', 'emergency_contact', 'emergency_contact_relation', 'emergency_contact_phone', 'blood_type'
                    ]);

                    if (!empty($studentUpdateData)) {
                        $student->update($studentUpdateData);
                    }

                    if ($student->user) {
                        $userUpdateData = $this->extractPresentFromArray($personal, ['phone', 'email']);
                        if (!empty($userUpdateData)) {
                            $student->user->update($userUpdateData);
                        }
                    }
                }

                if ($request->exists('physical_info')) {
                    $physical = $request->input('physical_info', []);
                    $physicalUpdateData = $this->extractPresentFromArray($physical, ['height_cm', 'weight_kg', 'blood_type']);

                    if (!empty($physicalUpdateData)) {
                        $height = array_key_exists('height_cm', $physicalUpdateData) ? $physicalUpdateData['height_cm'] : $student->height_cm;
                        $weight = array_key_exists('weight_kg', $physicalUpdateData) ? $physicalUpdateData['weight_kg'] : $student->weight_kg;

                        if (array_key_exists('height_cm', $physicalUpdateData) || array_key_exists('weight_kg', $physicalUpdateData)) {
                            $physicalUpdateData = array_merge($physicalUpdateData, $this->buildBmiUpdateData($height, $weight));
                            $physicalUpdateData['last_physical_update'] = now();
                        }

                        $student->update($physicalUpdateData);
                    }
                }

                if ($request->exists('medical_history')) {
                    $historyPayload = $request->input('medical_history', []);
                    $historyData = $this->extractPresentFromArray($historyPayload, [
                        'condition_asthma',
                        'condition_diabetes',
                        'condition_heart_problem',
                        'condition_hypertension',
                        'condition_seizure_disorder',
                        'condition_bleeding_disorder',
                        'condition_kidney_disease',
                        'condition_mental_health',
                        'other_conditions',
                        'current_medications',
                        'family_medical_history',
                        'notes'
                    ]);

                    if (!empty($historyData)) {
                        $history = MedicalHistory::firstOrCreate(['student_id' => $student->student_id]);
                        $history->fill($historyData);
                        if ($history->isDirty()) {
                            $history->save();
                        }
                    }
                }

                if ($request->exists('allergies')) {
                    $allergies = collect($request->input('allergies', []))
                        ->map(function ($item) {
                            return [
                                'allergy_name' => $item['allergy_name'] ?? null,
                                'severity' => $item['severity'] ?? 'mild',
                                'reaction_description' => $item['reaction_description'] ?? null,
                                'treatment_notes' => $item['treatment_notes'] ?? null,
                            ];
                        })
                        ->filter(fn ($item) => !empty($item['allergy_name']))
                        ->values();

                    Allergy::where('student_id', $student->student_id)->delete();
                    if ($allergies->isNotEmpty()) {
                        $insertData = $allergies->map(function ($item) use ($student) {
                            return array_merge($item, [
                                'student_id' => $student->student_id,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        })->all();

                        Allergy::insert($insertData);
                    }
                }
            });

            $student->refresh();

            return $this->sendResponse(
                $this->buildStudentMedicalPayload($student),
                'Medical data updated successfully'
            );
        } catch (\Exception $e) {
            return $this->sendError('Failed to update medical data', [
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
                return $this->sendResponse([
                    'students' => []
                ], 'Search query too short');
            }
            
            $students = Student::with(['currentSection.gradeLevel', 'allergies'])
                             ->where('is_active', true)
                             ->whereNull('deleted_at')
                             ->where(function($q) use ($query) {
                                 $q->where('student_number', 'LIKE', "%{$query}%")
                                   ->orWhere('first_name', 'LIKE', "%{$query}%")
                                   ->orWhere('last_name', 'LIKE', "%{$query}%")
                                   ->orWhereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$query}%"]);
                             })
                             ->limit(10)
                             ->get();
            
            $formattedStudents = $students->map(function($student) {
                $gradeSection = 'Unknown';
                if ($student->currentSection && $student->currentSection->gradeLevel) {
                    $gradeSection = $student->currentSection->gradeLevel->level_name . ' - ' . $student->currentSection->section_name;
                }
                
                return [
                    'student_id' => $student->student_id,
                    'student_number' => $student->student_number,
                    'first_name' => $student->first_name,
                    'last_name' => $student->last_name,
                    'full_name' => trim($student->first_name . ' ' . $student->last_name),
                    'grade_section' => $gradeSection,
                    'grade_level' => $student->currentSection && $student->currentSection->gradeLevel 
                        ? $student->currentSection->gradeLevel->level_name 
                        : 'Unknown',
                    'section' => $student->currentSection ? $student->currentSection->section_name : 'Unknown',
                    'emergency_contact' => $student->emergency_contact_name,
                    'emergency_contact_phone' => $student->emergency_contact_phone,
                    'allergies' => $student->allergies ? $student->allergies->pluck('allergy_name')->toArray() : [],
                    'avatar' => $student->gender === 'Female' ? 'assets/user-female.png' : 'assets/user-male.png'
                ];
            });
            
            return $this->sendResponse([
                'success' => true,
                'students' => $formattedStudents
            ], 'Students found successfully');
            
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
            
            $query = Student::with(['currentSection.gradeLevel', 'allergies', 'medicalHistory', 'medicalVisits' => function($q) {
                $q->where('visit_type', 'emergency')
                  ->where('visit_datetime', '>=', now()->subDays(30))
                  ->orderBy('visit_datetime', 'desc');
            }]);
            
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
            
            // Calculate clearance status
            $clearanceStatus = $this->calculateClearanceStatus($student);
            
            $gradeSection = 'Unknown';
            if ($student->currentSection && $student->currentSection->gradeLevel) {
                $gradeSection = $student->currentSection->gradeLevel->level_name . ' - ' . $student->currentSection->section_name;
            }
            
            $studentData = [
                'student_id' => $student->student_id,
                'student_number' => $student->student_number,
                'first_name' => $student->first_name,
                'last_name' => $student->last_name,
                'full_name' => trim($student->first_name . ' ' . $student->last_name),
                'grade_section' => $gradeSection,
                'grade_level' => $student->currentSection && $student->currentSection->gradeLevel 
                    ? $student->currentSection->gradeLevel->level_name 
                    : 'Unknown',
                'section' => $student->currentSection ? $student->currentSection->section_name : 'Unknown',
                'emergency_contact' => $student->emergency_contact_name,
                'emergency_contact_phone' => $student->emergency_contact_phone,
                'parentPhone' => $student->emergency_contact_phone,
                'allergies' => $student->allergies ? $student->allergies->pluck('allergy_name')->toArray() : [],
                'avatar' => $student->gender === 'Female' ? 'assets/user-female.png' : 'assets/user-male.png',
                'clearance' => $clearanceStatus,
                'emergency_contact' => [
                    'name' => $student->emergency_contact_name,
                    'phone' => $student->emergency_contact_phone
                ]
            ];
            
            return $this->sendResponse([
                'success' => true,
                'student' => $studentData
            ], 'Student found successfully');
            
        } catch (\Exception $e) {
            return $this->sendError('Failed to get student information', [
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Calculate medical clearance status for a student
     */
    private function calculateClearanceStatus($student)
    {
        $warnings = [];
        $level = 'green';
        $message = 'Medical clearance approved';

        // Check for allergies
        if ($student->allergies && $student->allergies->count() > 0) {
            $warnings[] = 'Has known allergies';
            $level = 'yellow';
            $message = 'Caution: Student has known allergies';
        }

        // Check for recent emergency visits (last 30 days)
        $recentEmergencyVisits = $student->medicalVisits->count();
        if ($recentEmergencyVisits > 0) {
            $warnings[] = 'Recent emergency visit';
            $level = 'red';
            $message = 'Medical clearance required - recent emergency visit';
        }

        // Check medical history for chronic conditions
        if ($student->medicalHistory) {
            $chronicConditions = ['asthma', 'diabetes', 'heart condition', 'epilepsy'];
            $medicalHistory = strtolower($student->medicalHistory->medical_history ?? '');
            
            foreach ($chronicConditions as $condition) {
                if (strpos($medicalHistory, $condition) !== false) {
                    $warnings[] = ucfirst($condition);
                    if ($level === 'green') {
                        $level = 'yellow';
                        $message = 'Caution: Student has chronic medical condition';
                    }
                }
            }
        }

        return [
            'level' => $level,
            'message' => $message,
            'warnings' => $warnings
        ];
    }

    /**
     * Get all students for clinic staff with filtering
     */
    public function getAllStudentsForStaff(Request $request)
    {
        try {
            $query = Student::with([
                'currentSection.gradeLevel', 
                'allergies',
                'medicalVisits' => function($q) {
                    $q->orderBy('visit_datetime', 'desc')->limit(1);
                }
            ])
            ->where('is_active', true)
            ->whereNull('deleted_at');
            
            // Filter by grade level
            if ($request->has('grade') && $request->grade !== '') {
                $query->whereHas('currentSection.gradeLevel', function($q) use ($request) {
                    $q->where('level_number', $request->grade);
                });
            }
            
            // Filter by section name
            if ($request->has('section') && $request->section !== '') {
                $query->whereHas('currentSection', function($q) use ($request) {
                    $q->where('section_name', $request->section);
                });
            }
            
            // Search by name or student number
            if ($request->has('search') && $request->search !== '') {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('student_number', 'LIKE', "%{$search}%")
                      ->orWhere('first_name', 'LIKE', "%{$search}%")
                      ->orWhere('last_name', 'LIKE', "%{$search}%")
                      ->orWhereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$search}%"]);
                });
            }
            
            $students = $query->orderBy('first_name')
                            ->orderBy('last_name')
                            ->get();
            
            $formattedStudents = $students->map(function($student) {
                $gradeSection = 'Unknown';
                if ($student->currentSection && $student->currentSection->gradeLevel) {
                    $gradeSection = $student->currentSection->gradeLevel->level_name . ' - ' . $student->currentSection->section_name;
                }
                
                $lastVisit = $student->medicalVisits->first();
                
                return [
                    'id' => $student->student_id,
                    'studentNumber' => $student->student_number,
                    'name' => trim($student->first_name . ' ' . $student->last_name),
                    'gradeSection' => $gradeSection,
                    'gender' => $student->gender,
                    'lastVisit' => $lastVisit ? $lastVisit->visit_datetime->format('Y-m-d') : null,
                    'hasAllergies' => $student->allergies && $student->allergies->count() > 0,
                    'avatar' => $student->gender === 'Female' ? 'assets/user-female.png' : 'assets/user-male.png'
                ];
            });
            
            return $this->sendResponse([
                'success' => true,
                'students' => $formattedStudents,
                'total' => $formattedStudents->count()
            ], 'Students retrieved successfully');
            
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve students', [
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function extractPresent(Request $request, array $fields): array
    {
        $result = [];
        foreach ($fields as $field) {
            if ($request->exists($field)) {
                $result[$field] = $request->input($field);
            }
        }

        return $result;
    }

    private function extractPresentFromArray(array $source, array $fields): array
    {
        $result = [];
        foreach ($fields as $field) {
            if (array_key_exists($field, $source)) {
                $result[$field] = $source[$field];
            }
        }

        return $result;
    }

    private function buildBmiUpdateData($height, $weight): array
    {
        if (!$height || !$weight) {
            return [
                'bmi' => null,
                'bmi_category' => null,
            ];
        }

        $heightM = $height / 100;
        $bmi = round($weight / ($heightM * $heightM), 2);

        $bmiCategory = 'Normal weight';
        if ($bmi < 18.5) {
            $bmiCategory = 'Underweight';
        } elseif ($bmi >= 25 && $bmi < 30) {
            $bmiCategory = 'Overweight';
        } elseif ($bmi >= 30) {
            $bmiCategory = 'Obese';
        }

        return [
            'bmi' => $bmi,
            'bmi_category' => $bmiCategory,
        ];
    }

    private function buildStudentMedicalPayload(Student $student): array
    {
        $student->loadMissing(['user', 'medicalHistory', 'allergies', 'currentAdviser']);

        return [
            'personal_info' => [
                'student_id' => $student->student_id,
                'student_number' => $student->student_number,
                'full_name' => $student->full_name,
                'birth_date' => $student->birth_date,
                'gender' => $student->gender,
                'blood_type' => $student->blood_type,
                'address' => $student->address,
                'emergency_contact' => $student->emergency_contact,
                'emergency_contact_relation' => $student->emergency_contact_relation,
                'emergency_contact_phone' => $student->emergency_contact_phone,
                'phone' => $student->user?->phone,
                'email' => $student->user?->email,
                'grade_level' => $student->grade_level,
                'section' => $student->section,
                'adviser_name' => $student->currentAdviser?->full_name,
                'adviser_contact' => $student->currentAdviser?->phone,
                'height_cm' => $student->height_cm,
                'weight_kg' => $student->weight_kg,
                'bmi' => $student->bmi,
                'bmi_category' => $student->bmi_category,
            ],
            'medical_history' => $student->medicalHistory,
            'allergies' => $student->allergies,
        ];
    }
}