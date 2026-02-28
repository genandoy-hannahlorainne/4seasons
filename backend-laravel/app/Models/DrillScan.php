<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DrillScan extends Model
{
    protected $fillable = [
        'drill_id',
        'participant_id',
        'scanned_by',
        'scan_type',
        'scanned_at',
        'seconds_from_start',
        'location',
        'notes',
        'metadata'
    ];

    protected $casts = [
        'scanned_at' => 'datetime',
        'metadata' => 'array'
    ];

    public function drill(): BelongsTo
    {
        return $this->belongsTo(EmergencyDrill::class, 'drill_id');
    }

    public function participant(): BelongsTo
    {
        return $this->belongsTo(DrillParticipant::class, 'participant_id');
    }

    public function scanner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'scanned_by', 'user_id');
    }

    // Helper methods
    public function isFirstScan(): bool
    {
        return $this->participant->scans()->where('scanned_at', '<', $this->scanned_at)->count() === 0;
    }

    public function getResponseTimeAttribute(): ?int
    {
        if ($this->drill && $this->drill->started_at) {
            return $this->scanned_at->diffInSeconds($this->drill->started_at);
        }
        return null;
    }
}
