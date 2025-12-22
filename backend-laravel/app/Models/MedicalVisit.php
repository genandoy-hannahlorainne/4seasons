<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MedicalVisit extends Model
{
    use HasFactory;

    protected $primaryKey = 'visit_id';
    public $timestamps = false;

    protected $fillable = [
        'student_id',
        'clinic_staff_id',
        'visit_datetime',
        'visit_type',
        'chief_complaint',
        'notes',
        'status'
    ];

    protected $casts = [
        'visit_datetime' => 'datetime'
    ];

    // Relationships
    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id', 'student_id');
    }

    public function clinicStaff()
    {
        return $this->belongsTo(ClinicStaff::class, 'clinic_staff_id', 'clinic_staff_id');
    }

    // Scopes
    public function scopeOpen($query)
    {
        return $query->where('status', 'Open');
    }

    public function scopeRecent($query, $days = 30)
    {
        return $query->where('visit_datetime', '>=', now()->subDays($days));
    }
}