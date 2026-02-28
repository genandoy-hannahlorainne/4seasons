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
            $query = MedicalVisit::with(['student' => function($query) {
                    $query->with(['currentSection' => function($query) {
                        $query->with(['gradeLevel']);
                    }]);
                }])
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
            
            // Filter by emergency visits (check visit_type instead of is_emergency)
            if ($request->has('emergency_only') && $request->get('emergency_only') === 'true') {
                $query->where('visit_type', 'Emergency');
            }
            
            // Filter by visit type
            if ($request->has('visit_type')) {
                $query->where('visit_type', $request->get('visit_type'));
            }
            
            $visits = $query->paginate(20);
            
            // Transform the data to include student information
            $visits->getCollection()->transform(function ($visit) {
                $student = $visit->student;
                $section = $student ? $student->currentSection : null;
                $gradeLevel = $section ? $section->gradeLevel : null;
                
                return [
                    'visit_id' => $visit->visit_id,
                    'student_id' => $visit->student_id,
                    'clinic_staff_id' => $visit->clinic_staff_id,
                    'visit_datetime' => $visit->visit_datetime,
                    'visit_type' => $visit->visit_type,
                    'chief_complaint' => $visit->chief_complaint,
                    'notes' => $visit->notes,
                    'status' => $visit->status,
                    'notify_parent' => $visit->notify_parent,
                    'notification_method' => $visit->notification_method,
                    'created_at' => $visit->created_at,
                    'student' => $student ? [
                        'student_id' => $student->student_id,
                        'student_number' => $student->student_number,
                        'first_name' => $student->first_name,
                        'last_name' => $student->last_name,
                        'full_name' => trim($student->first_name . ' ' . $student->last_name),
                        'grade_level' => $gradeLevel ? $gradeLevel->level_name : null,
                        'section' => $section ? $section->section_name : null,
                    ] : null
                ];
            });
            
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
                'notes' => 'nullable|string|max:1000',
                'notify_parent' => 'boolean',
                'visit_type' => 'required|in:Routine,Emergency,Follow-up,Referral',
                'status' => 'in:Open,Closed,Referred',
                'notification_method' => 'nullable|in:sms,email,call,none',
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
                    'notes' => $request->notes,
                    'notify_parent' => $request->boolean('notify_parent', false),
                    'visit_type' => $request->visit_type,
                    'status' => $request->status ?? 'Open',
                    'notification_method' => $request->notification_method ?? 'none'
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
                'chief_complaint' => 'nullable|string|max:500',
                'notes' => 'nullable|string|max:1000',
                'notify_parent' => 'boolean',
                'status' => 'in:Open,Closed,Referred',
                'notification_method' => 'nullable|in:sms,email,call,none'
            ]);

            $medicalVisit->update($request->only([
                'chief_complaint', 'notes', 'notify_parent',
                'status', 'notification_method'
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
     * Get medical visits for a specific student with statistics
     */
    public function getStudentVisits(Student $student, Request $request)
    {
        try {
            $query = $student->medicalVisits()
                           ->with(['clinicStaff.user', 'vitals'])
                           ->orderBy('visit_datetime', 'desc');
            
            // Get statistics
            $totalVisits = $student->medicalVisits()->count();
            $thisMonthVisits = $student->medicalVisits()
                                     ->whereMonth('visit_datetime', now()->month)
                                     ->whereYear('visit_datetime', now()->year)
                                     ->count();
            
            $lastVisit = $student->medicalVisits()
                               ->orderBy('visit_datetime', 'desc')
                               ->first();
            
            // Get paginated visits
            $visits = $query->paginate(10);
            
            $response = [
                'visits' => $visits,
                'statistics' => [
                    'total_visits' => $totalVisits,
                    'this_month_visits' => $thisMonthVisits,
                    'last_visit' => $lastVisit ? [
                        'visit_id' => $lastVisit->visit_id,
                        'visit_datetime' => $lastVisit->visit_datetime,
                        'visit_type' => $lastVisit->visit_type,
                        'chief_complaint' => $lastVisit->chief_complaint,
                        'status' => $lastVisit->status
                    ] : null
                ]
            ];
            
            return $this->sendResponse($response, 'Student medical visits retrieved successfully');
            
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve student visits', [
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get student visit history with detailed statistics
     */
    public function getStudentVisitHistory(Student $student, Request $request)
    {
        try {
            // Get all visits with relationships
            $allVisits = $student->medicalVisits()
                               ->with(['clinicStaff.user', 'vitals'])
                               ->orderBy('visit_datetime', 'desc')
                               ->get();
            
            // Calculate comprehensive statistics
            $totalVisits = $allVisits->count();
            $thisMonthVisits = $allVisits->filter(function($visit) {
                return $visit->visit_datetime->month === now()->month && 
                       $visit->visit_datetime->year === now()->year;
            })->count();
            
            $emergencyVisits = $allVisits->where('is_emergency', true)->count();
            $routineVisits = $allVisits->where('visit_type', 'routine')->count();
            
            // Get last visit details
            $lastVisit = $allVisits->first();
            
            // Group visits by month for chart data
            $visitsByMonth = $allVisits->groupBy(function($visit) {
                return $visit->visit_datetime->format('Y-m');
            })->map(function($visits, $month) {
                return [
                    'month' => $month,
                    'count' => $visits->count(),
                    'emergency_count' => $visits->where('is_emergency', true)->count()
                ];
            })->values();
            
            // Get recent visits (last 5)
            $recentVisits = $allVisits->take(5)->map(function($visit) {
                return [
                    'visit_id' => $visit->visit_id,
                    'visit_datetime' => $visit->visit_datetime,
                    'visit_type' => $visit->visit_type,
                    'chief_complaint' => $visit->chief_complaint,
                    'diagnosis' => $visit->chief_complaint,
                    'status' => $visit->status,
                    'is_emergency' => $visit->is_emergency,
                    'clinic_staff' => $visit->clinicStaff ? [
                        'name' => $visit->clinicStaff->user->full_name,
                        'position' => $visit->clinicStaff->position
                    ] : null
                ];
            });
            
            $response = [
                'statistics' => [
                    'total_visits' => $totalVisits,
                    'this_month_visits' => $thisMonthVisits,
                    'emergency_visits' => $emergencyVisits,
                    'routine_visits' => $routineVisits,
                    'last_visit' => $lastVisit ? [
                        'visit_id' => $lastVisit->visit_id,
                        'visit_datetime' => $lastVisit->visit_datetime,
                        'visit_type' => $lastVisit->visit_type,
                        'chief_complaint' => $lastVisit->chief_complaint,
                        'status' => $lastVisit->status,
                        'days_ago' => $lastVisit->visit_datetime->diffInDays(now())
                    ] : null
                ],
                'recent_visits' => $recentVisits,
                'visits_by_month' => $visitsByMonth,
                'visit_types_breakdown' => [
                    'routine' => $routineVisits,
                    'emergency' => $emergencyVisits,
                    'follow_up' => $allVisits->where('visit_type', 'follow_up')->count(),
                    'referral' => $allVisits->where('visit_type', 'referral')->count()
                ]
            ];
            
            return $this->sendResponse($response, 'Student visit history retrieved successfully');
            
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve visit history', [
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