<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\BaseController;
use App\Models\EmergencyDrill;
use App\Models\DrillParticipant;
use App\Models\DrillScan;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class EmergencyDrillController extends BaseController
{
    /**
     * Get all emergency drills
     */
    public function index(Request $request)
    {
        try {
            $query = EmergencyDrill::with(['creator', 'participants.student'])
                ->orderBy('created_at', 'desc');

            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            if ($request->has('drill_type')) {
                $query->where('drill_type', $request->drill_type);
            }

            $drills = $query->paginate(10);

            return $this->sendResponse($drills, 'Emergency drills retrieved successfully');

        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve drills', $e->getMessage());
        }
    }

    /**
     * Create a new emergency drill
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'drill_name' => 'required|string|max:255',
                'drill_type' => 'required|in:earthquake,fire,lockdown,medical,evacuation',
                'description' => 'nullable|string',
                'scheduled_at' => 'nullable|date|after:now',
                'settings' => 'nullable|array'
            ]);

            if ($validator->fails()) {
                return $this->sendError('Validation Error', $validator->errors()->first());
            }

            $drill = EmergencyDrill::create([
                'drill_name' => $request->drill_name,
                'drill_type' => $request->drill_type,
                'description' => $request->description,
                'scheduled_at' => $request->scheduled_at,
                'created_by' => auth()->id(),
                'settings' => $request->settings ?? []
            ]);

            return $this->sendResponse($drill->load('creator'), 'Emergency drill created successfully', 201);

        } catch (\Exception $e) {
            return $this->sendError('Failed to create drill', $e->getMessage());
        }
    }

    /**
     * Get drill details with participants
     */
    public function show($id)
    {
        try {
            $drill = EmergencyDrill::with([
                'creator',
                'participants.user.role',
                'participants.student.currentSection.gradeLevel',
                'participants.rescuer',
                'scans.scanner',
                'scans.participant.user',
                'scans.participant.student'
            ])->findOrFail($id);

            // Calculate statistics
            $statistics = $this->calculateDrillStatistics($drill);

            return $this->sendResponse([
                'drill' => $drill,
                'statistics' => $statistics
            ], 'Drill details retrieved successfully');

        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve drill', $e->getMessage());
        }
    }

    /**
     * Start an emergency drill
     */
    public function start($id)
    {
        try {
            $drill = EmergencyDrill::findOrFail($id);

            if (!$drill->canStart()) {
                return $this->sendError('Cannot start drill', 'Drill is not in planned status');
            }

            DB::beginTransaction();

            $drill->update([
                'status' => 'active',
                'started_at' => now()
            ]);

            // Update all participants' assigned_at timestamp
            $drill->participants()->update(['assigned_at' => now()]);

            DB::commit();

            return $this->sendResponse($drill, 'Emergency drill started successfully');

        } catch (\Exception $e) {
            DB::rollBack();
            return $this->sendError('Failed to start drill', $e->getMessage());
        }
    }

    /**
     * End an emergency drill
     */
    public function end($id)
    {
        try {
            $drill = EmergencyDrill::findOrFail($id);

            if (!$drill->canEnd()) {
                return $this->sendError('Cannot end drill', 'Drill is not active');
            }

            DB::beginTransaction();

            $endTime = now();
            $duration = $drill->started_at->diffInSeconds($endTime);

            // Calculate final statistics
            $statistics = $this->calculateDrillStatistics($drill);

            $drill->update([
                'status' => 'completed',
                'ended_at' => $endTime,
                'duration_seconds' => $duration,
                'statistics' => $statistics
            ]);

            DB::commit();

            return $this->sendResponse([
                'drill' => $drill,
                'statistics' => $statistics
            ], 'Emergency drill ended successfully');

        } catch (\Exception $e) {
            DB::rollBack();
            return $this->sendError('Failed to end drill', $e->getMessage());
        }
    }

    /**
     * Add participants to drill
     */
    public function addParticipants(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'participants' => 'required|array',
                'participants.*.user_id' => 'required|exists:users,user_id',
                'participants.*.role' => 'required|in:injured,rescuer,observer,evacuee',
                'participants.*.injury_simulation' => 'nullable|string',
                'participants.*.severity' => 'nullable|in:minor,moderate,severe,critical'
            ]);

            if ($validator->fails()) {
                return $this->sendError('Validation Error', $validator->errors()->first());
            }

            $drill = EmergencyDrill::findOrFail($id);

            if ($drill->status !== 'planned') {
                return $this->sendError('Cannot add participants', 'Drill must be in planned status');
            }

            DB::beginTransaction();

            $addedParticipants = [];

            foreach ($request->participants as $participantData) {
                $participant = DrillParticipant::updateOrCreate(
                    [
                        'drill_id' => $drill->id,
                        'user_id' => $participantData['user_id']
                    ],
                    [
                        'role' => $participantData['role'],
                        'injury_simulation' => $participantData['injury_simulation'] ?? null,
                        'severity' => $participantData['severity'] ?? null,
                        'assigned_at' => now()
                    ]
                );

                $addedParticipants[] = $participant->load(['user', 'student']);
            }

            DB::commit();

            return $this->sendResponse($addedParticipants, 'Participants added successfully');

        } catch (\Exception $e) {
            DB::rollBack();
            return $this->sendError('Failed to add participants', $e->getMessage());
        }
    }

    /**
     * Scan a participant (QR code scan)
     */
    public function scanParticipant(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'user_id' => 'nullable|integer',
                'student_number' => 'nullable|string',
                'scan_type' => 'nullable|string|in:qr,manual,nfc',
                'location' => 'nullable|array',
                'notes' => 'nullable|string'
            ]);

            if ($validator->fails()) {
                return $this->sendError('Validation Error', $validator->errors()->first());
            }

            // Must provide either user_id or student_number
            if (!$request->user_id && !$request->student_number) {
                return $this->sendError('Validation Error', 'Either user_id or student_number is required');
            }

            $drill = EmergencyDrill::findOrFail($id);

            if (!$drill->isActive()) {
                return $this->sendError('Cannot scan', 'Drill is not active');
            }

            // Find the participant by user_id or student_number
            $participant = null;
            
            if ($request->user_id) {
                // Search by user_id directly
                $participant = DrillParticipant::where('drill_id', $drill->id)
                    ->where('user_id', $request->user_id)
                    ->first();
            } elseif ($request->student_number) {
                // Search by student_number - need to find user_id first
                $student = \App\Models\Student::where('student_number', $request->student_number)->first();
                if ($student) {
                    $participant = DrillParticipant::where('drill_id', $drill->id)
                        ->where('user_id', $student->user_id)
                        ->first();
                }
            }

            if (!$participant) {
                return $this->sendError('Participant not found', 'User is not part of this drill or student number not found');
            }

            DB::beginTransaction();

            $scanTime = now();
            $secondsFromStart = $drill->started_at->diffInSeconds($scanTime);

            // Create scan record
            $scan = DrillScan::create([
                'drill_id' => $drill->id,
                'participant_id' => $participant->id,
                'scanned_by' => auth()->id(),
                'scan_type' => $request->scan_type ?? 'qr',
                'scanned_at' => $scanTime,
                'seconds_from_start' => $secondsFromStart,
                'notes' => $request->notes,
                'metadata' => $request->location ? ['location' => $request->location] : null
            ]);

            // Update participant
            $participant->addScan($scan);

            // If this is an injured participant being scanned, mark as rescued
            if ($participant->isInjured() && $participant->status === 'scanned') {
                $participant->update([
                    'status' => 'rescued',
                    'rescued_at' => $scanTime,
                    'rescuer_id' => auth()->id()
                ]);
            }

            DB::commit();

            // Send simulated SMS notification if enabled
            $this->sendSimulatedNotification($participant, $scan);

            return $this->sendResponse([
                'scan' => $scan->load(['participant.user', 'participant.student', 'scanner']),
                'participant' => $participant->fresh()->load(['user', 'student']),
                'response_time' => $secondsFromStart
            ], 'Participant scanned successfully');

        } catch (\Exception $e) {
            DB::rollBack();
            return $this->sendError('Failed to scan participant', $e->getMessage());
        }
    }

    /**
     * Get real-time drill dashboard
     */
    public function dashboard($id)
    {
        try {
            $drill = EmergencyDrill::with([
                'participants.user',
                'participants.student',
                'scans.participant.user',
                'scans.participant.student'
            ])->findOrFail($id);

            $statistics = $this->calculateDrillStatistics($drill);

            // Real-time metrics
            $realtimeData = [
                'drill_status' => $drill->status,
                'elapsed_time' => $drill->started_at ? $drill->started_at->diffInSeconds(now()) : 0,
                'total_participants' => $drill->participants->count(),
                'injured_count' => $drill->participants->where('role', 'injured')->count(),
                'scanned_count' => $drill->participants->whereNotNull('first_scan_at')->count(),
                'rescued_count' => $drill->participants->whereNotNull('rescued_at')->count(),
                'average_response_time' => $statistics['average_response_time'],
                'fastest_response' => $statistics['fastest_response'],
                'slowest_response' => $statistics['slowest_response'],
                'recent_scans' => $drill->scans()->with(['participant.student', 'scanner'])
                    ->orderBy('scanned_at', 'desc')
                    ->limit(10)
                    ->get()
            ];

            return $this->sendResponse($realtimeData, 'Drill dashboard data retrieved');

        } catch (\Exception $e) {
            return $this->sendError('Failed to get dashboard data', $e->getMessage());
        }
    }

    /**
     * Calculate drill statistics
     */
    private function calculateDrillStatistics($drill)
    {
        $participants = $drill->participants;
        $scannedParticipants = $participants->whereNotNull('response_time_seconds');

        $statistics = [
            'total_participants' => $participants->count(),
            'injured_participants' => $participants->where('role', 'injured')->count(),
            'rescuer_participants' => $participants->where('role', 'rescuer')->count(),
            'scanned_participants' => $scannedParticipants->count(),
            'rescued_participants' => $participants->whereNotNull('rescued_at')->count(),
            'average_response_time' => $scannedParticipants->avg('response_time_seconds'),
            'fastest_response' => $scannedParticipants->min('response_time_seconds'),
            'slowest_response' => $scannedParticipants->max('response_time_seconds'),
            'total_scans' => $drill->scans->count(),
            'completion_rate' => $participants->count() > 0 ? 
                ($scannedParticipants->count() / $participants->count()) * 100 : 0
        ];

        return $statistics;
    }

    /**
     * Search users for scanning (autocomplete)
     */
    public function searchUsers(Request $request, $id)
    {
        try {
            $query = $request->get('q', '');
            
            if (strlen($query) < 2) {
                return $this->sendResponse([], 'Query too short');
            }

            $drill = EmergencyDrill::findOrFail($id);

            // Search in users and students tables
            $users = User::with(['student', 'role'])
                ->where(function($q) use ($query) {
                    $q->where('full_name', 'LIKE', "%{$query}%")
                      ->orWhere('user_id', 'LIKE', "%{$query}%");
                })
                ->orWhereHas('student', function($q) use ($query) {
                    $q->where('student_number', 'LIKE', "%{$query}%")
                      ->orWhere('first_name', 'LIKE', "%{$query}%")
                      ->orWhere('last_name', 'LIKE', "%{$query}%");
                })
                ->limit(10)
                ->get();

            $results = $users->map(function($user) use ($drill) {
                $student = $user->student;
                $isParticipant = DrillParticipant::where('drill_id', $drill->id)
                    ->where('user_id', $user->user_id)
                    ->exists();

                return [
                    'user_id' => $user->user_id,
                    'full_name' => $user->full_name,
                    'student_number' => $student ? $student->student_number : null,
                    'student_name' => $student ? "{$student->first_name} {$student->last_name}" : null,
                    'role' => $user->role->role_name ?? 'Unknown',
                    'is_participant' => $isParticipant,
                    'display_text' => $student 
                        ? "{$student->first_name} {$student->last_name} ({$student->student_number})"
                        : "{$user->full_name} (ID: {$user->user_id})"
                ];
            });

            return $this->sendResponse($results, 'Users found');

        } catch (\Exception $e) {
            return $this->sendError('Failed to search users', $e->getMessage());
        }
    }

    /**
     * Send simulated SMS notification
     */
    private function sendSimulatedNotification($participant, $scan)
    {
        // In a real implementation, this would send actual SMS
        // For simulation, we just log it
        \Log::info('Simulated SMS sent', [
            'student' => $participant->student->full_name,
            'student_number' => $participant->student->student_number,
            'scan_time' => $scan->scanned_at,
            'response_time' => $scan->seconds_from_start,
            'message' => "DRILL ALERT: Your child {$participant->student->full_name} has been located and is safe during the emergency drill. Response time: {$scan->seconds_from_start} seconds."
        ]);
    }
}
