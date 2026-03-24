<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentSHDFStatus extends Model
{
    use HasFactory;

    protected $table = 'student_shdf_status';

    protected $fillable = [
        'student_id',
        'school_year_id',
        'basic_completed',
        'basic_completed_at',
        'comprehensive_completed',
        'comprehensive_completed_at',
        'comprehensive_deadline',
        'deadline_notified',
    ];

    protected $casts = [
        'basic_completed' => 'boolean',
        'comprehensive_completed' => 'boolean',
        'basic_completed_at' => 'datetime',
        'comprehensive_completed_at' => 'datetime',
        'comprehensive_deadline' => 'datetime',
        'deadline_notified' => 'boolean',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id', 'student_id');
    }

    public function schoolYear(): BelongsTo
    {
        return $this->belongsTo(SchoolYear::class);
    }

    /**
     * Check if basic info is complete (required for QR code)
     */
    public function canGenerateQRCode(): bool
    {
        return $this->basic_completed;
    }

    /**
     * Check if comprehensive info is complete
     */
    public function isFullyCompliant(): bool
    {
        return $this->basic_completed && $this->comprehensive_completed;
    }

    /**
     * Check if deadline is approaching (within 2 days)
     */
    public function isDeadlineApproaching(): bool
    {
        if (!$this->comprehensive_deadline) {
            return false;
        }

        return now()->diffInDays($this->comprehensive_deadline, false) <= 2
            && now()->diffInDays($this->comprehensive_deadline, false) >= 0;
    }

    /**
     * Check if deadline has passed
     */
    public function isOverdue(): bool
    {
        if (!$this->comprehensive_deadline) {
            return false;
        }

        return now()->isAfter($this->comprehensive_deadline) && !$this->comprehensive_completed;
    }
}
