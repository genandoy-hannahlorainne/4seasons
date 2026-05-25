<?php

namespace App\Support;

use Carbon\Carbon;

class PhilippineDateTime
{
    public const TZ = 'Asia/Manila';

    public static function now(): Carbon
    {
        return Carbon::now(self::TZ);
    }

    public static function parse(mixed $value): ?Carbon
    {
        if ($value === null || $value === '') {
            return null;
        }

        if ($value instanceof Carbon) {
            return $value->copy()->timezone(self::TZ);
        }

        return Carbon::parse($value)->timezone(self::TZ);
    }

    /** ISO-8601 with +08:00 offset for API consumers. */
    public static function toApiIso(mixed $value): ?string
    {
        return self::parse($value)?->toIso8601String();
    }

    public static function timeAgo(mixed $value): string
    {
        $timestamp = self::parse($value);
        if (!$timestamp) {
            return 'Unknown';
        }

        $now = self::now();
        if ($timestamp->greaterThan($now)) {
            return 'Just now';
        }

        $seconds = (int) $timestamp->diffInSeconds($now);
        if ($seconds < 60) {
            return 'Just now';
        }

        $minutes = (int) $timestamp->diffInMinutes($now);
        if ($minutes < 60) {
            return $minutes . 'm ago';
        }

        $hours = (int) $timestamp->diffInHours($now);
        if ($hours < 24) {
            return $hours . 'h ago';
        }

        $days = (int) $timestamp->diffInDays($now);
        if ($days < 7) {
            return $days . 'd ago';
        }

        return $timestamp->format('M j, Y g:i A');
    }
}
