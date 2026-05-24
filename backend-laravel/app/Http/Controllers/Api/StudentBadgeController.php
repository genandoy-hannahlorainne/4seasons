<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\BaseController;
use App\Services\GroqService;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class StudentBadgeController extends BaseController
{
    /**
     * Get streak badge metadata from frontend assets directory
     */
    public function getStreakBadgeMetadata(Request $request)
    {
        try {
            $candidatePaths = [
                // Works when frontend source is available beside backend-laravel.
                base_path('../frontend/src/app/assets/badges/streak/metadata.json'),
                // Docker-safe fallback stored inside Laravel project.
                base_path('resources/badges/streak/metadata.json'),
                // Optional deployment fallback if metadata is copied to public assets.
                public_path('assets/badges/streak/metadata.json'),
            ];

            $metadataPath = null;
            foreach ($candidatePaths as $path) {
                if (file_exists($path)) {
                    $metadataPath = $path;
                    break;
                }
            }

            if (!$metadataPath) {
                return $this->sendError('Streak badge metadata not found', [], 404);
            }

            $raw = file_get_contents($metadataPath);
            $decoded = json_decode($raw, true);

            if (!is_array($decoded) || !isset($decoded['badges']) || !is_array($decoded['badges'])) {
                return $this->sendError('Invalid streak badge metadata format', [], 422);
            }

            $badges = collect($decoded['badges'])
                ->sortBy('required_streak_days')
                ->map(function ($badge) {
                    $iconFile = $badge['icon_file'] ?? '';

                    return [
                        'badge_key' => $badge['badge_key'] ?? null,
                        'badge_name' => $badge['badge_name'] ?? null,
                        'tier' => $badge['tier'] ?? 'bronze',
                        'required_streak_days' => (int)($badge['required_streak_days'] ?? 0),
                        'description' => $badge['description'] ?? null,
                        'icon_file' => $iconFile,
                        'icon_asset_path' => $iconFile ? ('assets/badges/streak/' . $iconFile) : null,
                    ];
                })
                ->values();

            return $this->sendResponse([
                'feature' => $decoded['feature'] ?? 'student_streak_badges',
                'version' => $decoded['version'] ?? '1.0.0',
                'timezone' => $decoded['timezone'] ?? 'Asia/Manila',
                'count_weekends' => (bool)($decoded['count_weekends'] ?? false),
                'streak_type' => $decoded['streak_type'] ?? 'school_day_streak',
                'description' => $decoded['description'] ?? '',
                'badges' => $badges,
                'total_badges' => $badges->count(),
            ], 'Streak badge metadata retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve streak badge metadata', $e->getMessage(), 500);
        }
    }

    /**
     * Get student's current wellness streak and badge status
     */
    public function getStudentBadges(Request $request, $studentId)
    {
        try {
            $student = \App\Models\Student::find($studentId);
            if (!$student) {
                return $this->sendError('Student not found', [], 404);
            }

            // Fetch all visits oldest → newest to compute max streak across entire history
            $visits = \App\Models\MedicalVisit::where('student_id', $studentId)
                ->orderBy('visit_datetime', 'asc')
                ->pluck('visit_datetime');

            $maxStreak     = 0;
            $currentStreak = 0;

            if ($visits->isEmpty()) {
                // No visits at all — streak runs from enrollment to today
                $startDate     = \Carbon\Carbon::parse($student->created_at ?? now()->subDays(365));
                $currentStreak = $this->countWeekdays($startDate, now());
                $maxStreak     = $currentStreak;
            } else {
                // Gap from enrollment to first visit
                $enrollDate = \Carbon\Carbon::parse($student->created_at ?? $visits->first());
                $firstVisit = \Carbon\Carbon::parse($visits->first());
                $maxStreak  = max($maxStreak, $this->countWeekdays($enrollDate, $firstVisit));

                // Gaps between consecutive visits
                for ($i = 0; $i < $visits->count() - 1; $i++) {
                    $from      = \Carbon\Carbon::parse($visits[$i]);
                    $to        = \Carbon\Carbon::parse($visits[$i + 1]);
                    $maxStreak = max($maxStreak, $this->countWeekdays($from, $to));
                }

                // Current ongoing streak since last visit (resets on a new visit, but maxStreak won't drop)
                $lastVisitDate = \Carbon\Carbon::parse($visits->last());
                $currentStreak = $this->countWeekdays($lastVisitDate, now());
                $maxStreak     = max($maxStreak, $currentStreak);
            }

            // Load badge metadata
            $metadataPath = base_path('resources/badges/streak/metadata.json');
            if (!file_exists($metadataPath)) {
                return $this->sendError('Badge metadata not found', [], 404);
            }

            $metadata = json_decode(file_get_contents($metadataPath), true);
            $badges = collect($metadata['badges'])->sortBy('required_streak_days');

            // Badges unlock based on maxStreak so a new visit never un-earns an already-earned badge.
            // Progress toward the next badge uses currentStreak (the live ongoing streak).
            $badgeStatus = $badges->map(function ($badge) use ($maxStreak, $currentStreak) {
                $required   = $badge['required_streak_days'];
                $isUnlocked = $maxStreak >= $required;

                // Progress uses whichever is higher: current ongoing streak or max (already earned = 100%)
                $progressBase = $isUnlocked ? $required : $currentStreak;

                return [
                    'badge_key'            => $badge['badge_key'],
                    'badge_name'           => $badge['badge_name'],
                    'tier'                 => $badge['tier'],
                    'required_streak_days' => $required,
                    'description'          => $badge['description'],
                    'icon_file'            => $badge['icon_file'],
                    'icon_asset_path'      => 'assets/badges/streak/' . $badge['icon_file'],
                    'is_unlocked'          => $isUnlocked,
                    'is_earned'            => $isUnlocked,
                    'progress_percentage'  => min(100, ($progressBase / $required) * 100),
                    'days_remaining'       => $isUnlocked ? 0 : ($required - $currentStreak),
                ];
            });

            // Find next badge to unlock
            $nextBadge     = $badgeStatus->where('is_unlocked', false)->first();
            $unlockedBadges = $badgeStatus->where('is_unlocked', true);

            // Check for new badge notifications
            $this->checkAndCreateBadgeNotifications($studentId, $unlockedBadges, $maxStreak);

            $lastVisitDatetime = $visits->isNotEmpty()
                ? \App\Models\MedicalVisit::where('student_id', $studentId)
                    ->orderBy('visit_datetime', 'desc')
                    ->value('visit_datetime')
                : null;

            return $this->sendResponse([
                'student_id'              => $studentId,
                'current_wellness_streak' => $currentStreak,
                'max_wellness_streak'     => $maxStreak,
                'last_clinic_visit'       => $lastVisitDatetime,
                'total_badges_available'  => $badges->count(),
                'badges_unlocked'         => $unlockedBadges->count(),
                'badges_remaining'        => $badges->count() - $unlockedBadges->count(),
                'next_badge'              => $nextBadge,
                'badges'                  => $badgeStatus->values(),
                'streak_message'          => $this->generateStreakMessage($currentStreak, $nextBadge),
            ], 'Student badges retrieved successfully');

        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve student badges', [
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate motivational streak message
     */
    private function generateStreakMessage($currentStreak, $nextBadge)
    {
        if ($currentStreak === 0) {
            return "Great! You're starting your wellness journey. Keep staying healthy!";
        }

        if ($currentStreak === 1) {
            return "Awesome! 1 day of staying healthy. Keep it up!";
        }

        if (!$nextBadge) {
            return "Incredible! You've unlocked all wellness badges. You're a health legend!";
        }

        $daysRemaining = $nextBadge['days_remaining'];
        $nextBadgeName = $nextBadge['badge_name'];

        return "Amazing! {$currentStreak} days of wellness! Only {$daysRemaining} more days to unlock '{$nextBadgeName}' badge.";
    }

    /**
     * Generate AI badge narrative text
     */
    public function generateBadgeText(Request $request, GroqService $groqService)
    {
        try {
            $validator = Validator::make($request->all(), [
                'student_name' => 'required|string|max:120',
                'badge_name' => 'required|string|max:120',
                'streak_days' => 'required|integer|min:1|max:5000',
                'badge_key' => 'nullable|string|max:80',
            ]);

            if ($validator->fails()) {
                return $this->sendError('Validation Error', $validator->errors()->first(), 422);
            }

            $studentName = trim((string) $request->input('student_name'));
            $badgeName = trim((string) $request->input('badge_name'));
            $streakDays = (int) $request->input('streak_days');
            $badgeKey = $request->input('badge_key');

            $result = $groqService->generateBadgeNarrative($studentName, $badgeName, $streakDays);

            if ($result['success']) {
                return $this->sendResponse([
                    'student_name' => $studentName,
                    'badge_name' => $badgeName,
                    'badge_key' => $badgeKey,
                    'streak_days' => $streakDays,
                    'narrative' => $result['data']['narrative'] ?? '',
                    'source' => $result['data']['source'] ?? 'groq',
                    'ai_success' => true,
                ], 'Badge narrative generated successfully');
            }

            return $this->sendResponse([
                'student_name' => $studentName,
                'badge_name' => $badgeName,
                'badge_key' => $badgeKey,
                'streak_days' => $streakDays,
                'narrative' => $result['data']['narrative'] ?? '',
                'source' => $result['data']['source'] ?? 'fallback',
                'ai_success' => false,
                'fallback_reason' => $result['message'] ?? 'AI service unavailable',
            ], 'Badge narrative fallback text generated');
        } catch (\Exception $e) {
            return $this->sendError('Failed to generate badge narrative', $e->getMessage(), 500);
        }
    }

    /**
     * Get badge notifications for a student
     */
    public function getBadgeNotifications(Request $request, $studentId)
    {
        try {
            $student = \App\Models\Student::find($studentId);
            if (!$student) {
                return $this->sendError('Student not found', [], 404);
            }

            $notifications = Notification::where('student_id', $studentId)
                ->where('channel', 'System')
                ->where('message', 'like', '%badge%')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($notification) {
                    $metadata = $notification->metadata ?? [];
                    return [
                        'id' => $notification->notification_id,
                        'badge_key' => $metadata['badge_key'] ?? null,
                        'badge_name' => $metadata['badge_name'] ?? 'Badge',
                        'badge_tier' => $metadata['badge_tier'] ?? 'bronze',
                        'streak_days' => $metadata['streak_days'] ?? 0,
                        'message' => $notification->message,
                        'status' => $notification->status,
                        'created_at' => $notification->created_at,
                        'is_read' => $notification->status === 'Sent',
                        'icon_file' => $metadata['icon_file'] ?? null,
                    ];
                });

            return $this->sendResponse([
                'student_id' => $studentId,
                'notifications' => $notifications,
                'unread_count' => $notifications->where('is_read', false)->count(),
                'total_count' => $notifications->count(),
            ], 'Badge notifications retrieved successfully');

        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve badge notifications', [
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark badge notification as read
     */
    public function markNotificationAsRead(Request $request, $notificationId)
    {
        try {
            $notification = Notification::find($notificationId);
            if (!$notification) {
                return $this->sendError('Notification not found', [], 404);
            }

            $notification->markAsRead();

            return $this->sendResponse([
                'notification_id' => $notificationId,
                'status' => 'read'
            ], 'Notification marked as read');

        } catch (\Exception $e) {
            return $this->sendError('Failed to mark notification as read', [
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function countWeekdays(\Carbon\Carbon $from, \Carbon\Carbon $to): int
    {
        $count   = 0;
        $current = $from->copy()->startOfDay()->addDay();
        $end     = $to->copy()->startOfDay();

        while ($current->lte($end)) {
            if ($current->isWeekday()) {
                $count++;
            }
            $current->addDay();
        }

        return $count;
    }

    /**
     * Check and create badge notifications for newly unlocked badges
     */
    private function checkAndCreateBadgeNotifications($studentId, $unlockedBadges, $currentStreak)
    {
        try {
            foreach ($unlockedBadges as $badge) {
                // Check if notification already exists for this badge
                $existingNotification = Notification::where('student_id', $studentId)
                    ->where('channel', 'System')
                    ->where('message', 'like', '%' . $badge['badge_name'] . '%')
                    ->first();

                if (!$existingNotification) {
                    // Create new badge notification
                    $message = "🎉 Congratulations! You've earned the '{$badge['badge_name']}' badge for maintaining a {$badge['required_streak_days']}-day wellness streak!";
                    
                    Notification::create([
                        'student_id' => $studentId,
                        'channel' => 'System',
                        'message' => $message,
                        'status' => 'Pending',
                        'priority' => $badge['tier'] === 'legend' ? 'urgent' : 'normal',
                        'metadata' => [
                            'badge_key' => $badge['badge_key'],
                            'badge_name' => $badge['badge_name'],
                            'badge_tier' => $badge['tier'],
                            'streak_days' => $badge['required_streak_days'],
                            'icon_file' => $badge['icon_file'],
                            'notification_type' => 'badge_earned'
                        ]
                    ]);
                }
            }
        } catch (\Exception $e) {
            // Log error but don't fail the main request
            \Log::error('Failed to create badge notifications: ' . $e->getMessage());
        }
    }
}
