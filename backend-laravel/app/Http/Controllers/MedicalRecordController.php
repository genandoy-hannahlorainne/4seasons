<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\MedicalVisit;
use App\Models\Allergy;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class MedicalRecordController extends Controller
{
    /**
     * Get student's medical record information
     */
    public function getMedicalRecord(Request $request): JsonResponse
    {
        try {
            // Debug: Log all headers and query params
            \Log::info('Headers received:', $request->headers->all());
            \Log::info('Query params:', $request->query->all());
            
            // Get user_id from header or query parameter (temporary solution)
            $userId = $request->header('user_id') ?: $request->query('user_id');
            
            \Log::info('User ID from header/query:', ['user_id' => $userId]);
            
            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'User ID not provided',
                    'debug_headers' => $request->headers->all(),
                    'debug_query' => $request->query->all()
                ], 401);
            }

            $student = Student::where('user_id', $userId)->first();

            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student record not found'
                ], 404);
            }

            // Get student basic info with medical data
            $medicalRecord = [
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
                    'section' => $student->section
                ],
                'allergies' => $student->allergies()->get(['allergy_id', 'allergy_text', 'severity', 'recorded_at']),
                'recent_visits_count' => $student->medicalVisits()->where('visit_datetime', '>=', now()->subDays(30))->count(),
                'total_visits_count' => $student->medicalVisits()->count()
            ];

            return response()->json([
                'success' => true,
                'data' => $medicalRecord
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving medical record: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get student's medical visits history
     */
    public function getMedicalVisits(Request $request): JsonResponse
    {
        try {
            // Get user_id from header (temporary solution)
            $userId = $request->header('user_id');
            
            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'User ID not provided'
                ], 401);
            }

            $student = Student::where('user_id', $userId)->first();

            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student record not found'
                ], 404);
            }

            $visits = $student->medicalVisits()
                ->with(['clinicStaff.user'])
                ->orderBy('visit_datetime', 'desc')
                ->get()
                ->map(function ($visit) {
                    return [
                        'visit_id' => $visit->visit_id,
                        'visit_datetime' => $visit->visit_datetime,
                        'visit_type' => $visit->visit_type,
                        'chief_complaint' => $visit->chief_complaint,
                        'notes' => $visit->notes,
                        'status' => $visit->status,
                        'clinic_staff' => $visit->clinicStaff ? [
                            'name' => $visit->clinicStaff->user ? $visit->clinicStaff->user->full_name : 'Unknown Staff',
                            'position' => $visit->clinicStaff->position
                        ] : null
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $visits
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving medical visits: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get specific medical visit details
     */
    public function getVisitDetails($visitId): JsonResponse
    {
        try {
            // Get user_id from request header (temporary solution)
            $userId = request()->header('user_id');
            
            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'User ID not provided'
                ], 401);
            }

            $student = Student::where('user_id', $userId)->first();

            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student record not found'
                ], 404);
            }

            $visit = $student->medicalVisits()
                ->with(['clinicStaff.user'])
                ->where('visit_id', $visitId)
                ->first();

            if (!$visit) {
                return response()->json([
                    'success' => false,
                    'message' => 'Visit not found'
                ], 404);
            }

            $visitDetails = [
                'visit_id' => $visit->visit_id,
                'visit_datetime' => $visit->visit_datetime,
                'visit_type' => $visit->visit_type,
                'chief_complaint' => $visit->chief_complaint,
                'notes' => $visit->notes,
                'status' => $visit->status,
                'clinic_staff' => $visit->clinicStaff ? [
                    'name' => $visit->clinicStaff->user ? $visit->clinicStaff->user->full_name : 'Unknown Staff',
                    'position' => $visit->clinicStaff->position,
                    'contact' => $visit->clinicStaff->user ? $visit->clinicStaff->user->phone : null
                ] : null
            ];

            return response()->json([
                'success' => true,
                'data' => $visitDetails
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving visit details: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update student's personal medical information
     */
    public function updateMedicalInfo(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'emergency_contact' => 'nullable|string|max:255',
                'address' => 'nullable|string|max:500'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Get user_id from header (temporary solution)
            $userId = $request->header('user_id');
            
            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'User ID not provided'
                ], 401);
            }

            $student = Student::where('user_id', $userId)->first();

            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student record not found'
                ], 404);
            }

            // Update only allowed fields
            $updateData = [];
            if ($request->has('emergency_contact')) {
                $updateData['emergency_contact'] = $request->emergency_contact;
            }
            if ($request->has('address')) {
                $updateData['address'] = $request->address;
            }

            if (!empty($updateData)) {
                $student->update($updateData);
            }

            return response()->json([
                'success' => true,
                'message' => 'Medical information updated successfully',
                'data' => [
                    'emergency_contact' => $student->emergency_contact,
                    'address' => $student->address
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating medical information: ' . $e->getMessage()
            ], 500);
        }
    }
}