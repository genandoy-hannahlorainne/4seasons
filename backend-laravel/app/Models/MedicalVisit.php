<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MedicalVisit extends Model
{
    use HasFactory;

    protected $primaryKey = 'visit_id';

    protected $fillable = [
        'student_id',
        'clinic_staff_id',
        'visit_datetime',
        'chief_complaint',
        'diagnosis',
        'treatment_given',
        'medications_given',
        'notes',
        'follow_up_required',
        'follow_up_date',
        'parent_notified',
        'adviser_notified',
        'is_emergency',
        'visit_type',
        'status'
    ];

    protected function casts(): array
    {
        return [
            'visit_datetime' => 'datetime',
            'follow_up_date' => 'date',
            'parent_notified' => 'boolean',
            'adviser_notified' => 'boolean',
            'is_emergency' => 'boolean',
            'follow_up_required' => 'boolean'
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
        return $query->where('is_emergency', true);
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