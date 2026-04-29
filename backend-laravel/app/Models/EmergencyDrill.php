<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmergencyDrill extends Model
{
    protected $fillable = [
        'drill_name',
        'drill_type',
        'description',
        'status',
        'scheduled_at',
        'started_at',
        'ended_at',
        'duration_seconds',
        'created_by',
        'settings',
        'statistics'
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'settings' => 'array',
        'statistics' => 'array'
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by', 'user_id');
    }

    public function participants(): HasMany
    {
        return $this->hasMany(DrillParticipant::class, 'drill_id');
    }

    public function scans(): HasMany
    {
        return $this->hasMany(DrillScan::class, 'drill_id');
    }

    public function injuredParticipants(): HasMany
    {
        return $this->hasMany(DrillParticipant::class, 'drill_id')->where('role', 'injured');
    }

    public function rescuers(): HasMany
    {
        return $this->hasMany(DrillParticipant::class, 'drill_id')->where('role', 'rescuer');
    }

    // Helper methods
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function canStart(): bool
    {
        if ($this->status !== 'planned') {
            return false;
        }

        // If scheduled_at is set, check if current time is at or after scheduled time
        if ($this->scheduled_at) {
            $now = \Carbon\Carbon::now();
            $scheduledTime = $this->scheduled_at;

            // Allow starting only at or after scheduled time (up to 30 minutes after)
            $allowedEndTime = $scheduledTime->copy()->addMinutes(30);

            \Log::info('🔍 Model canStart check', [
                'now' => $now->toDateTimeString(),
                'now_tz' => $now->timezone->getName(),
                'scheduled' => $scheduledTime->toDateTimeString(),
                'scheduled_tz' => $scheduledTime->timezone->getName(),
                'allowed_end' => $allowedEndTime->toDateTimeString(),
                'can_start' => $now->greaterThanOrEqualTo($scheduledTime) && $now->lessThanOrEqualTo($allowedEndTime)
            ]);

            return $now->greaterThanOrEqualTo($scheduledTime) && $now->lessThanOrEqualTo($allowedEndTime);
        }

        // If no scheduled_at, allow starting anytime
        return true;
    }

    public function canEnd(): bool
    {
        return $this->status === 'active';
    }

    public function getDurationAttribute(): ?int
    {
        if ($this->started_at && $this->ended_at) {
            return $this->ended_at->diffInSeconds($this->started_at);
        }
        return null;
    }

    public function getAverageResponseTimeAttribute(): ?float
    {
        $participants = $this->participants()->whereNotNull('response_time_seconds')->get();
        if ($participants->isEmpty()) {
            return null;
        }
        return $participants->avg('response_time_seconds');
    }
}
