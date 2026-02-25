<?php

namespace App\Http\Controllers\Api;

use App\Models\MedicalVisit;
use App\Models\Student;
use App\Models\Vital;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MedicalVisitController extends BaseController
{
    /**
     * Display a listing of medical visits
     */
    public function index(Request $request)
    {
        try {
            $query = MedicalVisit::with(['student.user', 'clinicStaff.user', 'vitals'])
                                ->orderBy('visit_datetime', 'desc');
            
            // Filter by student if provided
            if ($request->has('student_id')) {
                $query->where('student_id', $request->get('student_id'));
            }
            
            // Filter by date range
            if ($request->has('date_from')) {
                $query->whereDate('visit_datetime', '>=', $request->get('date_from'));
            }
            
            if ($request->has('date_to')) {
                $query->whereDate('visit_datetime', '<=', $request->get('date_to'));
            }
            
            // Filter by emergency visits
            if ($request->has('emergency_only') && $request->get('emergency_only') === 'true') {
                $query->where('is_emergency', true);
            }
            
            // Filter by visit type
            if ($request->has('visit_type')) {
                $query->where('visit_type', $request->get('visit_type'));
            }
            
            $visits = $query->paginate(20);
            
            return $this->sendResponse($visits, 'Medical visits retrieved successfully');
            
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve medical visits', [
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created medical visit
     */
    public function store(Request $request)
    {
        try {
            $request->validate([
                'student_id' => 'required|exists:students,student_id',
                'clinic_staff_id' => 'required|exists:clinic_staff,clinic_staff_id',
                'chief_complaint' => 'required|string|max:500',
                'diagnosis' => 'nullable|string|max:500',
                'treatment_given' => 'nullable|string|max:1000',
                'medications_given' => 'nullable|string|max:500',
                'notes' => 'nullable|string|max:1000',
                'follow_up_required' => 'boolean',
                'follow_up_date' => 'nullable|date|after:today',
                'parent_notified' => 'boolean',
                'adviser_notified' => 'boolean',
                'is_emergency' => 'boolean',
                'visit_type' => 'required|in:routine,emergency,follow_up,referral',
                'status' => 'in:active,completed,cancelled',
                // Vitals data
                'vitals' => 'nullable|array',
                'vitals.*.vital_type' => 'required_with:vitals|in:blood_pressure,heart_rate,temperature,respiratory_rate,oxygen_saturation,height,weight',
                'vitals.*.value' => 'required_with:vitals|string|max:50',
                'vitals.*.unit' => 'nullable|string|max:20',
                'vitals.*.notes' => 'nullable|string|max:200'
            ]);

            DB::transaction(function () use ($request, &$visit) {
                // Create medical visit
                $visit = MedicalVisit::create([
                    'student_id' => $request->student_id,
                    'clinic_staff_id' => $request->clinic_staff_id,
                    'visit_datetime' => now(),
                    'chief_complaint' => $request->chief_complaint,
                    'diagnosis' => $request->diagnosis,
                    'treatment_given' => $request->treatment_given,
                    'medications_given' => $request->medications_given,
                    'notes' => $request->notes,
                    'follow_up_required' => $request->boolean('follow_up_required', false),
                    'follow_up_date' => $request->follow_up_date,
                    'parent_notified' => $request->boolean('parent_notified', false),
                    'adviser_notified' => $request->boolean('adviser_notified', false),
                    'is_emergency' => $request->boolean('is_emergency', false),
                    'visit_type' => $request->visit_type,
                    'status' => $request->get('status', 'active')
                ]);

                // Add vitals if provided
                if ($request->has('vitals') && is_array($request->vitals)) {
                    foreach ($request->vitals as $vitalData) {
                        Vital::create([
                            'visit_id' => $visit->visit_id,
                            'vital_type' => $vitalData['vital_type'],
                            'value' => $vitalData['value'],
                            'unit' => $vitalData['unit'] ?? null,
                            'notes' => $vitalData['notes'] ?? null,
                            'recorded_at' => now()
                        ]);
                    }
                }
            });

            // Load relationships for response
            $visit->load(['student.user', 'clinicStaff.user', 'vitals']);

            return $this->sendResponse($visit, 'Medical visit created successfully', 201);

        } catch (ValidationException $e) {
            return $this->sendValidationError($e->errors());
        } catch (\Exception $e) {
            return $this->sendError('Failed to create medical visit', [
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified medical visit
     */
    public function show(MedicalVisit $medicalVisit)
    {
        try {
            $medicalVisit->load(['student.user', 'clinicStaff.user', 'vitals']);
            
            return $this->sendResponse($medicalVisit, 'Medical visit retrieved successfully');
            
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve medical visit', [
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified medical visit
     */
    public function update(Request $request, MedicalVisit $medicalVisit)
    {
        try {
            $request->validate([
                'diagnosis' => 'nullable|string|max:500',
                'treatment_given' => 'nullable|string|max:1000',
                'medications_given' => 'nullable|string|max:500',
                'notes' => 'nullable|string|max:1000',
                'follow_up_required' => 'boolean',
                'follow_up_date' => 'nullable|date|after:today',
                'parent_notified' => 'boolean',
                'adviser_notified' => 'boolean',
                'status' => 'in:active,completed,cancelled'
            ]);

            $medicalVisit->update($request->only([
                'diagnosis', 'treatment_given', 'medications_given', 'notes',
                'follow_up_required', 'follow_up_date', 'parent_notified',
                'adviser_notified', 'status'
            ]));

            $medicalVisit->load(['student.user', 'clinicStaff.user', 'vitals']);

            return $this->sendResponse($medicalVisit, 'Medical visit updated successfully');

        } catch (ValidationException $e) {
            return $this->sendValidationError($e->errors());
        } catch (\Exception $e) {
            return $this->sendError('Failed to update medical visit', [
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get medical visits for a specific student
     */
    public function getStudentVisits(Student $student, Request $request)
    {
        try {
            $query = $student->medicalVisits()
                           ->with(['clinicStaff.user', 'vitals'])
                           ->orderBy('visit_datetime', 'desc');
            
            // Limit results if requested
            if ($request->has('limit')) {
                $limit = min((int)$request->get('limit'), 50); // Max 50 visits
                $visits = $query->limit($limit)->get();
            } else {
                $visits = $query->paginate(10);
            }
            
            return $this->sendResponse($visits, 'Student medical visits retrieved successfully');
            
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve student visits', [
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get recent emergency visits
     */
    public function getEmergencyVisits(Request $request)
    {
        try {
            $days = $request->get('days', 7); // Default to last 7 days
            
            $visits = MedicalVisit::with(['student.user', 'clinicStaff.user'])
                                ->where('is_emergency', true)
                                ->where('visit_datetime', '>=', now()->subDays($days))
                                ->orderBy('visit_datetime', 'desc')
                                ->limit(20)
                                ->get();
            
            return $this->sendResponse($visits, 'Emergency visits retrieved successfully');
            
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve emergency visits', [
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get visit statistics
     */
    public function getStatistics(Request $request)
    {
        try {
            $days = $request->get('days', 30); // Default to last 30 days
            $startDate = now()->subDays($days);
            
            $stats = [
                'total_visits' => MedicalVisit::where('visit_datetime', '>=', $startDate)->count(),
                'emergency_visits' => MedicalVisit::where('visit_datetime', '>=', $startDate)
                                                ->where('is_emergency', true)->count(),
                'follow_up_required' => MedicalVisit::where('visit_datetime', '>=', $startDate)
                                                  ->where('follow_up_required', true)->count(),
                'visits_by_type' => MedicalVisit::where('visit_datetime', '>=', $startDate)
                                                ->groupBy('visit_type')
                                                ->selectRaw('visit_type, count(*) as count')
                                                ->pluck('count', 'visit_type'),
                'daily_visits' => MedicalVisit::where('visit_datetime', '>=', $startDate)
                                             ->groupBy(DB::raw('DATE(visit_datetime)'))
                                             ->selectRaw('DATE(visit_datetime) as date, count(*) as count')
                                             ->orderBy('date')
                                             ->get()
            ];
            
            return $this->sendResponse($stats, 'Visit statistics retrieved successfully');
            
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve statistics', [
                'error' => $e->getMessage()
            ], 500);
        }
    }
}