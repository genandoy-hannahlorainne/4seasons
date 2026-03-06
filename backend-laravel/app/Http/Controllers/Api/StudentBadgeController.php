<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\BaseController;
use App\Services\GroqService;
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
                'badges' => $badges,
                'total_badges' => $badges->count(),
            ], 'Streak badge metadata retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve streak badge metadata', $e->getMessage(), 500);
        }
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
}
