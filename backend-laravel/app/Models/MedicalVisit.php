<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MedicalVisit extends Model
{
    use HasFactory;

    protected $primaryKey = 'visit_id';
    
    // The table only has created_at, not updated_at
    const UPDATED_AT = null;

    protected $fillable = [
        'student_id',
        'clinic_staff_id',
        'visit_datetime',
        'visit_type',
        'chief_complaint',
        'notes',
        'status',
        'notify_parent',
        'parent_notified_at',
        'notification_method'
    ];

    protected function casts(): array
    {
        return [
            'visit_datetime' => 'datetime',
            'parent_notified_at' => 'datetime',
            'notify_parent' => 'boolean'
        ];
    }

    /**
     * Relationships
     */
    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id', 'student_id');
    }

    public function clinicStaff()
    {
        return $this->belongsTo(ClinicStaff::class, 'clinic_staff_id', 'clinic_staff_id');
    }

    public function vitals()
    {
        return $this->hasMany(Vital::class, 'visit_id', 'visit_id');
    }

    /**
     * Scopes
     */
    public function scopeEmergency($query)
    {
        return $query->where('visit_type', 'Emergency');
    }

    public function scopeRecent($query, $days = 30)
    {
        return $query->where('visit_datetime', '>=', now()->subDays($days));
    }

    public function scopeForStudent($query, $studentId)
    {
        return $query->where('student_id', $studentId);
    }
}