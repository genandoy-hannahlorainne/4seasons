<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\BaseController;
use App\Models\SchoolYear;
use App\Models\Section;
use App\Models\GradeLevel;
use App\Models\User;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class SchoolYearController extends BaseController
{
    /**
     * Get all school years
     */
    public function index()
    {
        try {
            $schoolYears = SchoolYear::orderBy('year_name', 'desc')->get();
            
            return $this->sendResponse($schoolYears, 'School years retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve school years', $e->getMessage());
        }
    }

    /**
     * Create a new school year
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'year_name' => 'required|string|max:20|unique:school_years,year_name',
                'start_date' => 'required|date',
                'end_date' => 'required|date|after:start_date',
                'is_active' => 'boolean'
            ]);

            if ($validator->fails()) {
                return $this->sendError('Validation Error', $validator->errors()->first());
            }

            $schoolYear = SchoolYear::create([
                'year_name' => $request->year_name,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'is_current' => false, // New school years are not current by default
                'is_active' => $request->get('is_active', true)
            ]);

            return $this->sendResponse([
                'school_year' => $schoolYear,
                'school_year_id' => $schoolYear->id
            ], 'School year created successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to create school year', $e->getMessage());
        }
    }

    /**
     * Get current school year
     */
    public function getCurrent()
    {
        try {
            $currentYear = SchoolYear::where('is_current', true)->first();
            
            if (!$currentYear) {
                return $this->sendError('No current school year set');
            }

            return $this->sendResponse($currentYear, 'Current school year retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve current school year', $e->getMessage());
        }
    }

    /**
     * Set a school year as current
     */
    public function setCurrent(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'school_year_id' => 'required|integer|exists:school_years,id'
            ]);

            if ($validator->fails()) {
                return $this->sendError('Validation Error', $validator->errors()->first());
            }

            DB::beginTransaction();

            // Remove current flag from all school years
            SchoolYear::where('is_current', true)->update(['is_current' => false]);

            // Set the selected school year as current
            $schoolYear = SchoolYear::findOrFail($request->school_year_id);
            $schoolYear->update(['is_current' => true, 'is_active' => true]);

            DB::commit();

            return $this->sendResponse($schoolYear, 'Current school year updated successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->sendError('Failed to set current school year', $e->getMessage());
        }
    }

    /**
     * Get all grade levels
     */
    public function getGradeLevels()
    {
        try {
            $gradeLevels = GradeLevel::active()->ordered()->get();
            
            return $this->sendResponse($gradeLevels, 'Grade levels retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve grade levels', $e->getMessage());
        }
    }

    /**
     * Get sections for a school year
     */
    public function getSections(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'school_year_id' => 'required|integer|exists:school_years,id'
            ]);

            if ($validator->fails()) {
                return $this->sendError('Validation Error', $validator->errors()->first());
            }

            $sections = Section::with(['gradeLevel', 'schoolYear', 'adviser'])
                ->where('school_year_id', $request->school_year_id)
                ->where('is_active', true)
                ->get()
                ->map(function ($section) {
                    return [
                        'id' => $section->id,
                        'section_name' => $section->section_name,
                        'grade_level_id' => $section->grade_level_id,
                        'school_year_id' => $section->school_year_id,
                        'adviser_id' => $section->adviser_id,
                        'capacity' => $section->capacity,
                        'current_enrollment' => $section->students()->where('is_active', true)->count(),
                        'is_active' => $section->is_active,
                        'level_name' => $section->gradeLevel->level_name ?? 'Unknown',
                        'level_number' => $section->gradeLevel->level_number ?? 0,
                        'year_name' => $section->schoolYear->year_name ?? 'Unknown',
                        'adviser_name' => $section->adviser ? $section->adviser->full_name : null
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
                'section_name' => 'required|string|max:50',
                'grade_level_id' => 'required|integer|exists:grade_levels,id',
                'school_year_id' => 'required|integer|exists:school_years,id',
                'capacity' => 'required|integer|min:1|max:100'
            ]);

            if ($validator->fails()) {
                return $this->sendError('Validation Error', $validator->errors()->first());
            }

            // Check for duplicate section name in the same grade level and school year
            $exists = Section::where('section_name', $request->section_name)
                ->where('grade_level_id', $request->grade_level_id)
                ->where('school_year_id', $request->school_year_id)
                ->where('is_active', true)
                ->exists();

            if ($exists) {
                return $this->sendError('Section already exists for this grade level and school year');
            }

            $section = Section::create([
                'section_name' => $request->section_name,
                'grade_level_id' => $request->grade_level_id,
                'school_year_id' => $request->school_year_id,
                'capacity' => $request->capacity,
                'adviser_id' => null,
                'is_active' => true
            ]);

            return $this->sendResponse($section, 'Section created successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to create section', $e->getMessage());
        }
    }

    /**
     * Get available advisers
     */
    public function getAdvisers()
    {
        try {
            $advisers = User::where('role_id', 2) // Adviser role
                ->where('is_active', true)
                ->whereNull('deleted_at')
                ->get()
                ->map(function ($user) {
                    return [
                        'adviser_id' => $user->user_id,
                        'user_id' => $user->user_id,
                        'first_name' => $user->first_name,
                        'last_name' => $user->last_name,
                        'full_name' => $user->full_name,
                        'employee_number' => $user->employee_number ?? 'N/A',
                        'email' => $user->email
                    ];
                });

            return $this->sendResponse($advisers, 'Advisers retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve advisers', $e->getMessage());
        }
    }

    /**
     * Assign adviser to section
     */
    public function assignAdviser(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'section_id' => 'required|integer|exists:sections,id',
                'adviser_user_id' => 'nullable|integer|exists:users,user_id'
            ]);

            if ($validator->fails()) {
                return $this->sendError('Validation Error', $validator->errors()->first());
            }

            DB::beginTransaction();

            $section = Section::findOrFail($request->section_id);
            $section->update(['adviser_id' => $request->adviser_user_id]);

            // Update all students in this section to have this adviser
            $studentsUpdated = 0;
            if ($request->adviser_user_id) {
                $studentsUpdated = Student::where('current_section_id', $section->id)
                    ->where('is_active', true)
                    ->update(['current_adviser_id' => $request->adviser_user_id]);
            } else {
                // If removing adviser, set students' adviser to null
                $studentsUpdated = Student::where('current_section_id', $section->id)
                    ->where('is_active', true)
                    ->update(['current_adviser_id' => null]);
            }

            DB::commit();

            return $this->sendResponse([
                'section' => $section,
                'students_updated' => $studentsUpdated
            ], 'Adviser assigned successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->sendError('Failed to assign adviser', $e->getMessage());
        }
    }

    /**
     * Get students in a section
     */
    public function getSectionStudents(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'section_id' => 'required|integer|exists:sections,id'
            ]);

            if ($validator->fails()) {
                return $this->sendError('Validation Error', $validator->errors()->first());
            }

            $section = Section::with(['gradeLevel', 'schoolYear', 'adviser'])->findOrFail($request->section_id);
            
            $students = Student::with(['allergies', 'medicalVisits' => function($query) {
                    $query->latest()->limit(1);
                }])
                ->where('current_section_id', $request->section_id)
                ->where('is_active', true)
                ->get()
                ->map(function ($student) {
                    $lastVisit = $student->medicalVisits->first();
                    return [
                        'student_id' => $student->student_id,
                        'student_number' => $student->student_number,
                        'full_name' => trim($student->first_name . ' ' . $student->last_name),
                        'gender' => $student->gender,
                        'age' => $student->age,
                        'blood_type' => $student->blood_type,
                        'emergency_contact' => $student->emergency_contact_name,
                        'emergency_contact_phone' => $student->emergency_contact_phone,
                        'enrollment_status' => $student->is_active ? 'active' : 'inactive',
                        'allergies' => $student->allergies->pluck('allergy_name')->toArray(),
                        'last_visit' => $lastVisit ? [
                            'visit_datetime' => $lastVisit->visit_datetime,
                            'visit_type' => $lastVisit->visit_type
                        ] : null
                    ];
                });

            $stats = [
                'total_students' => $students->count(),
                'students_with_allergies' => $students->filter(function($student) {
                    return count($student['allergies']) > 0;
                })->count(),
                'students_with_visits' => $students->filter(function($student) {
                    return $student['last_visit'] !== null;
                })->count()
            ];

            return $this->sendResponse([
                'success' => true,
                'section' => [
                    'id' => $section->id,
                    'section_name' => $section->section_name,
                    'grade_level' => $section->gradeLevel->level_name ?? 'Unknown',
                    'school_year' => $section->schoolYear->year_name ?? 'Unknown',
                    'adviser_name' => $section->adviser ? $section->adviser->full_name : null,
                    'capacity' => $section->capacity,
                    'current_enrollment' => $students->count()
                ],
                'students' => $students,
                'stats' => $stats
            ], 'Section students retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve section students', $e->getMessage());
        }
    }

    /**
     * Get all sections for current active school year (for filtering)
     */
    public function getAllSections()
    {
        try {
            // Get current active school year
            $currentYear = SchoolYear::where('is_current', true)->first();
            
            if (!$currentYear) {
                return $this->sendError('No current school year set');
            }

            $sections = Section::with(['gradeLevel'])
                ->where('school_year_id', $currentYear->id)
                ->where('is_active', true)
                ->orderBy('grade_level_id')
                ->orderBy('section_name')
                ->get()
                ->map(function ($section) {
                    return [
                        'id' => $section->id,
                        'section_name' => $section->section_name,
                        'grade_level_id' => $section->grade_level_id,
                        'level_name' => $section->gradeLevel->level_name ?? 'Unknown',
                        'level_number' => $section->gradeLevel->level_number ?? 0
                    ];
                });

            return $this->sendResponse($sections, 'All sections retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve sections', $e->getMessage());
        }
    }
}