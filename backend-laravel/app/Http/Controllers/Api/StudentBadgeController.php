<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\BaseController;
use Illuminate\Http\Request;

class StudentBadgeController extends BaseController
{
    /**
     * Get streak badge metadata from frontend assets directory
     */
    public function getStreakBadgeMetadata(Request $request)
    {
        try {
            $metadataPath = base_path('../frontend/src/app/assets/badges/streak/metadata.json');

            if (!file_exists($metadataPath)) {
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
}
