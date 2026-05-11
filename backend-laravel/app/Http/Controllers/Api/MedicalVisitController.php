<?php

namespace App\Http\Controllers\Api;

use App\Models\MedicalVisit;
use App\Models\Notification;
use App\Models\Student;
use App\Models\Vital;
use App\Services\WebPushService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
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
                'visit_type' => 'required|in:Routine,Emergency',
                'status' => 'in:Open,Closed,Referred',
                'notification_method' => 'nullable|in:sms,email,call,none',
                'visit_datetime' => 'nullable|date',
                'vitals' => 'nullable|array'
            ]);

            $visit = null;

            DB::transaction(function () use ($request, &$visit) {
                $medicalVisitColumns = Schema::getColumnListing('medical_visits');

                // Create medical visit
                $visitPayload = $this->buildMedicalVisitInsertPayload($request, $medicalVisitColumns);

                // visit_id is not auto-increment, so generate it manually
                if (in_array('visit_id', $medicalVisitColumns, true) && !isset($visitPayload['visit_id'])) {
                    $nextId = ((int) DB::table('medical_visits')->max('visit_id')) + 1;
                    $visitPayload['visit_id'] = $nextId > 0 ? $nextId : 1;
                }

                DB::table('medical_visits')->insert($visitPayload);
                $visitId = $visitPayload['visit_id'];
                $visit = MedicalVisit::find($visitId);

                // Create notification for all visits (adviser + admin visibility)
                $student = Student::find($request->student_id);
                $studentName = $student
                    ? trim($student->first_name . ' ' . $student->last_name)
                    : 'Unknown Student';

                $isEmergency = strtolower($request->input('visit_type', '')) === 'emergency';

                Notification::create([
                    'student_id' => $request->student_id,
                    'visit_id'   => $visitId,
                    'channel'    => 'System',
                    'message'    => $isEmergency
                        ? "Emergency visit: {$studentName} requires immediate attention"
                        : "Clinic visit: {$studentName} visited the clinic — {$request->chief_complaint}",
                    'priority'   => $isEmergency ? 'urgent' : 'normal',
                    'status'     => 'Pending',
                ]);

                // Add vitals if provided
                if ($request->has('vitals') && is_array($request->vitals)) {
                    $vitalsPayload = [
                        'visit_id' => $visit->visit_id,
                        'temperature_c' => null,
                        'bp_systolic' => null,
                        'bp_diastolic' => null,
                        'pulse_rate' => null,
                        'respiration_rate' => null,
                        'height_cm' => null,
                        'weight_kg' => null,
                        'notes' => null,
                        'recorded_at' => now(),
                    ];

                    if (array_is_list($request->vitals)) {
                        foreach ($request->vitals as $vitalData) {
                            if (!is_array($vitalData)) {
                                continue;
                            }

                            $vitalType = $vitalData['vital_type'] ?? null;
                            $vitalValue = $vitalData['value'] ?? null;
                            if ($vitalType === null || $vitalValue === null || $vitalValue === '') {
                                continue;
                            }

                            switch ($vitalType) {
                                case 'temperature':
                                case 'temperature_c':
                                    $vitalsPayload['temperature_c'] = $vitalValue;
                                    break;
                                case 'blood_pressure':
                                case 'bp':
                                    $bp = $this->parseBloodPressure((string)$vitalValue);
                                    $vitalsPayload['bp_systolic'] = $bp['systolic'];
                                    $vitalsPayload['bp_diastolic'] = $bp['diastolic'];
                                    break;
                                case 'heart_rate':
                                case 'pulse_rate':
                                    $vitalsPayload['pulse_rate'] = $vitalValue;
                                    break;
                                case 'respiratory_rate':
                                case 'respiration_rate':
                                    $vitalsPayload['respiration_rate'] = $vitalValue;
                                    break;
                                case 'height':
                                case 'height_cm':
                                    $vitalsPayload['height_cm'] = $vitalValue;
                                    break;
                                case 'weight':
                                case 'weight_kg':
                                    $vitalsPayload['weight_kg'] = $vitalValue;
                                    break;
                            }

                            if (!empty($vitalData['notes']) && empty($vitalsPayload['notes'])) {
                                $vitalsPayload['notes'] = $vitalData['notes'];
                            }
                        }
                    } else {
                        $vitalsPayload['temperature_c'] = $request->input('vitals.temperature') ?? $request->input('vitals.temperature_c');
                        $bloodPressure = $request->input('vitals.blood_pressure') ?? $request->input('vitals.bp');
                        if ($bloodPressure) {
                            $bp = $this->parseBloodPressure((string)$bloodPressure);
                            $vitalsPayload['bp_systolic'] = $bp['systolic'];
                            $vitalsPayload['bp_diastolic'] = $bp['diastolic'];
                        }
                        $vitalsPayload['pulse_rate'] = $request->input('vitals.pulse_rate');
                        $vitalsPayload['respiration_rate'] = $request->input('vitals.respiration_rate') ?? $request->input('vitals.respiratory_rate');
                        $vitalsPayload['height_cm'] = $request->input('vitals.height_cm');
                        $vitalsPayload['weight_kg'] = $request->input('vitals.weight_kg');
                        $vitalsPayload['notes'] = $request->input('vitals.notes');
                    }

                    $hasVitals = collect([
                        $vitalsPayload['temperature_c'],
                        $vitalsPayload['bp_systolic'],
                        $vitalsPayload['bp_diastolic'],
                        $vitalsPayload['pulse_rate'],
                        $vitalsPayload['respiration_rate'],
                        $vitalsPayload['height_cm'],
                        $vitalsPayload['weight_kg'],
                    ])->filter(function ($value) {
                        return $value !== null && $value !== '';
                    })->isNotEmpty();

                    if ($hasVitals) {
                        $this->storeVitalsCompat($vitalsPayload);
                    }
                }
            });

            if (!$visit) {
                return $this->sendError('Failed to create medical visit', [], 500);
            }

            // Fire push notification to the student's adviser.
            // Done outside the transaction so a push failure never rolls back the visit.
            $this->dispatchAdviserPush(
                $request->student_id,
                $visit->student ? trim($visit->student->first_name . ' ' . $visit->student->last_name) : 'Unknown Student',
                $request->input('visit_type'),
                $request->chief_complaint,
                $visit->visit_id
            );

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

    private function parseBloodPressure(string $value): array
    {
        $trimmed = trim($value);
        if ($trimmed === '') {
            return ['systolic' => null, 'diastolic' => null];
        }

        if (preg_match('/^(\d{2,3})\s*\/\s*(\d{2,3})$/', $trimmed, $matches)) {
            return [
                'systolic' => (int)$matches[1],
                'diastolic' => (int)$matches[2],
            ];
        }

        if (preg_match('/^(\d{2,3})$/', $trimmed, $single)) {
            return [
                'systolic' => (int)$single[1],
                'diastolic' => null,
            ];
        }

        return ['systolic' => null, 'diastolic' => null];
    }

    private function buildMedicalVisitInsertPayload(Request $request, array $columns): array
    {
        $payload = [];
        $isLegacySchema = in_array('parent_notified', $columns, true) && !in_array('notify_parent', $columns, true);

        if (in_array('student_id', $columns, true)) {
            $payload['student_id'] = $request->student_id;
        }
        if (in_array('clinic_staff_id', $columns, true)) {
            $payload['clinic_staff_id'] = $request->clinic_staff_id;
        }
        if (in_array('visit_datetime', $columns, true)) {
            $payload['visit_datetime'] = $request->input('visit_datetime', now());
        }
        if (in_array('chief_complaint', $columns, true)) {
            $payload['chief_complaint'] = $request->chief_complaint;
        }
        if (in_array('notes', $columns, true)) {
            $payload['notes'] = $request->notes;
        }

        $notifyParent = $request->boolean('notify_parent', false);
        if (in_array('notify_parent', $columns, true)) {
            $payload['notify_parent'] = $notifyParent;
        }
        if (in_array('parent_notified', $columns, true)) {
            $payload['parent_notified'] = $notifyParent;
        }
        if (in_array('notification_method', $columns, true)) {
            $payload['notification_method'] = $request->notification_method ?? 'none';
        }

        $visitType = (string)$request->input('visit_type', 'Routine');
        if (in_array('visit_type', $columns, true)) {
            $payload['visit_type'] = $isLegacySchema ? strtolower($visitType) : $visitType;
        }
        if (in_array('is_emergency', $columns, true)) {
            $payload['is_emergency'] = strtolower($visitType) === 'emergency';
        }

        $status = (string)$request->input('status', 'Open');
        if (in_array('status', $columns, true)) {
            if ($isLegacySchema) {
                $legacyStatus = 'active';
                if (strcasecmp($status, 'Closed') === 0) {
                    $legacyStatus = 'completed';
                } elseif (strcasecmp($status, 'Referred') === 0) {
                    $legacyStatus = 'cancelled';
                }
                $payload['status'] = $legacyStatus;
            } else {
                $payload['status'] = $status;
            }
        }

        if (in_array('created_at', $columns, true) && !array_key_exists('created_at', $payload)) {
            $payload['created_at'] = now();
        }

        return $payload;
    }

    private function storeVitalsCompat(array $vitalsPayload): void
    {
        try {
            $columns = Schema::getColumnListing('vitals');
            if (empty($columns)) {
                return;
            }

            $insert = [];

            if (in_array('visit_id', $columns, true)) {
                $insert['visit_id'] = $vitalsPayload['visit_id'] ?? null;
            }
            if (in_array('recorded_at', $columns, true)) {
                $insert['recorded_at'] = $vitalsPayload['recorded_at'] ?? now();
            }
            if (in_array('notes', $columns, true) && array_key_exists('notes', $vitalsPayload)) {
                $insert['notes'] = $vitalsPayload['notes'];
            }

            if (in_array('temperature_c', $columns, true) && array_key_exists('temperature_c', $vitalsPayload)) {
                $insert['temperature_c'] = $vitalsPayload['temperature_c'];
            } elseif (in_array('temperature', $columns, true) && array_key_exists('temperature_c', $vitalsPayload)) {
                $insert['temperature'] = $vitalsPayload['temperature_c'];
            }

            if (in_array('bp_systolic', $columns, true) && array_key_exists('bp_systolic', $vitalsPayload)) {
                $insert['bp_systolic'] = $vitalsPayload['bp_systolic'];
            }
            if (in_array('bp_diastolic', $columns, true) && array_key_exists('bp_diastolic', $vitalsPayload)) {
                $insert['bp_diastolic'] = $vitalsPayload['bp_diastolic'];
            }
            if (in_array('blood_pressure', $columns, true)) {
                $systolic = $vitalsPayload['bp_systolic'] ?? null;
                $diastolic = $vitalsPayload['bp_diastolic'] ?? null;
                if ($systolic !== null && $systolic !== '') {
                    $insert['blood_pressure'] = $diastolic !== null && $diastolic !== ''
                        ? $systolic . '/' . $diastolic
                        : (string)$systolic;
                }
            }

            if (in_array('pulse_rate', $columns, true) && array_key_exists('pulse_rate', $vitalsPayload)) {
                $insert['pulse_rate'] = $vitalsPayload['pulse_rate'];
            }

            if (in_array('respiration_rate', $columns, true) && array_key_exists('respiration_rate', $vitalsPayload)) {
                $insert['respiration_rate'] = $vitalsPayload['respiration_rate'];
            } elseif (in_array('respiratory_rate', $columns, true) && array_key_exists('respiration_rate', $vitalsPayload)) {
                $insert['respiratory_rate'] = $vitalsPayload['respiration_rate'];
            }

            if (in_array('height_cm', $columns, true) && array_key_exists('height_cm', $vitalsPayload)) {
                $insert['height_cm'] = $vitalsPayload['height_cm'];
            }
            if (in_array('weight_kg', $columns, true) && array_key_exists('weight_kg', $vitalsPayload)) {
                $insert['weight_kg'] = $vitalsPayload['weight_kg'];
            }

            if (in_array('vitals_id', $columns, true)) {
                $nextId = ((int)DB::table('vitals')->max('vitals_id')) + 1;
                $insert['vitals_id'] = $nextId > 0 ? $nextId : 1;
            }

            $filtered = collect($insert)
                ->filter(function ($value, $key) {
                    if (in_array($key, ['visit_id', 'recorded_at', 'vitals_id'], true)) {
                        return true;
                    }
                    return $value !== null && $value !== '';
                })
                ->toArray();

            if (count($filtered) <= 2) {
                return;
            }

            DB::table('vitals')->insert($filtered);
        } catch (\Throwable $e) {
            Log::warning('Vitals insert skipped for compatibility', [
                'error' => $e->getMessage(),
                'visit_id' => $vitalsPayload['visit_id'] ?? null,
            ]);
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

            $emergencyVisits = $allVisits->where('visit_type', 'Emergency')->count();
            $routineVisits = $allVisits->where('visit_type', 'Routine')->count();

            // Get last visit details
            $lastVisit = $allVisits->first();

            // Group visits by month for chart data
            $visitsByMonth = $allVisits->groupBy(function($visit) {
                return $visit->visit_datetime->format('Y-m');
            })->map(function($visits, $month) {
                return [
                    'month' => $month,
                    'count' => $visits->count(),
                    'emergency_count' => $visits->where('visit_type', 'Emergency')->count()
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
                    'is_emergency' => $visit->visit_type === 'Emergency',
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
                        'days_ago' => (int) \Carbon\Carbon::parse($lastVisit->visit_datetime, 'UTC')->setTimezone(config('app.timezone'))->diffInDays(now())
                    ] : null
                ],
                'recent_visits' => $recentVisits,
                'visits_by_month' => $visitsByMonth,
                'visit_types_breakdown' => [
                    'routine' => $routineVisits,
                    'emergency' => $emergencyVisits
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
                                ->where('visit_type', 'Emergency')
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
     * Send a Web Push notification to the adviser of the given student.
     * Called after the DB transaction so a push failure never rolls back the visit.
     */
    private function dispatchAdviserPush(int $studentId, string $studentName, string $visitType, ?string $complaint, int $visitId): void
    {
        try {
            $student = Student::find($studentId);
            if (!$student || !$student->current_adviser_id) {
                return;
            }

            // current_adviser_id stores users.user_id (same as sections.adviser_id FK)
            $adviserUserId = (int) $student->current_adviser_id;

            $isEmergency = strtolower($visitType) === 'emergency';
            $body = $isEmergency
                ? "{$studentName} has an EMERGENCY visit. Immediate attention may be needed."
                : "{$studentName} visited the clinic. Reason: " . ($complaint ?? 'General visit');

            $payload = [
                'title'   => $isEmergency ? '🚨 Emergency Clinic Visit' : '🏥 Clinic Visit Notification',
                'body'    => $body,
                'icon'    => '/assets/icons/school-clinic.png',
                'badge'   => '/assets/icons/notification.png',
                'tag'     => "visit-{$visitId}",
                'data'    => [
                    'visit_id'   => $visitId,
                    'student_id' => $studentId,
                    'url'        => '/adviser/notifications',
                ],
                'actions' => [
                    ['action' => 'view', 'title' => 'View Details'],
                    ['action' => 'dismiss', 'title' => 'Dismiss'],
                ],
                'requireInteraction' => $isEmergency,
            ];

            // Try FCM first, fall back to WebPush
            app(\App\Services\FcmDirectService::class)->sendToUser($adviserUserId, $payload);

            Log::info("FCM: dispatched to user_id={$adviserUserId} for student_id={$studentId}, visit_id={$visitId}");
        } catch (\Throwable $e) {
            Log::error('FCM dispatch failed for adviser: ' . $e->getMessage(), [
                'student_id' => $studentId,
                'visit_id'   => $visitId,
            ]);
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
                // Note: is_emergency and follow_up_required columns don't exist in actual database
                // Using visit_type = 'Emergency' instead of is_emergency
                'emergency_visits' => MedicalVisit::where('visit_datetime', '>=', $startDate)
                                                ->where('visit_type', 'Emergency')->count(),
                'pending_visits' => MedicalVisit::where('visit_datetime', '>=', $startDate)
                                                  ->where('status', 'Open')->count(),
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
