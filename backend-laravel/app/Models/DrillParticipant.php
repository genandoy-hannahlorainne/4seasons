<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DrillParticipant extends Model
{
    protected $fillable = [
        'drill_id',
        'user_id',
        'role',
        'status',
        'injury_simulation',
        'severity',
        'assigned_at',
        'first_scan_at',
        'rescued_at',
        'response_time_seconds',
        'rescuer_id',
        'scan_history'
    ];

    protected $casts = [
        'assigned_at' => 'datetime',
        'first_scan_at' => 'datetime',
        'rescued_at' => 'datetime',
        'scan_history' => 'array'
    ];

    public function drill(): BelongsTo
    {
        return $this->belongsTo(EmergencyDrill::class, 'drill_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'user_id', 'user_id');
    }

    public function rescuer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rescuer_id', 'user_id');
    }

    public function scans(): HasMany
    {
        return $this->hasMany(DrillScan::class, 'participant_id');
    }

    // Helper methods
    public function isInjured(): bool
    {
        return $this->role === 'injured';
    }

    public function isRescuer(): bool
    {
        return $this->role === 'rescuer';
    }

    public function hasBeenScanned(): bool
    {
        return !is_null($this->first_scan_at);
    }

    public function hasBeenRescued(): bool
    {
        return !is_null($this->rescued_at);
    }

    public function calculateResponseTime(): void
    {
        if ($this->drill && $this->drill->started_at && $this->first_scan_at) {
            $this->response_time_seconds = $this->first_scan_at->diffInSeconds($this->drill->started_at);
            $this->save();
        }
    }

    public function addScan(DrillScan $scan): void
    {
        $scanHistory = $this->scan_history ?? [];
        $scanHistory[] = [
            'scan_id' => $scan->id,
            'scanned_at' => $scan->scanned_at->toISOString(),
            'scanned_by' => $scan->scanned_by,
            'seconds_from_start' => $scan->seconds_from_start
        ];
        
        $this->scan_history = $scanHistory;
        
        // Update first scan if this is the first one
        if (is_null($this->first_scan_at)) {
            $this->first_scan_at = $scan->scanned_at;
            $this->status = 'scanned';
            $this->calculateResponseTime();
        }
        
        $this->save();
    }
}
