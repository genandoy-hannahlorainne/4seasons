<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Section extends Model
{
    use HasFactory;

    protected $table = 'sections';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'section_name',
        'grade_level_id',
        'school_year_id',
        'adviser_id',
        'capacity',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'capacity' => 'integer'
    ];

    // Relationships
    public function gradeLevel()
    {
        return $this->belongsTo(GradeLevel::class, 'grade_level_id');
    }

    public function schoolYear()
    {
        return $this->belongsTo(SchoolYear::class, 'school_year_id');
    }

    public function adviser()
    {
        return $this->belongsTo(User::class, 'adviser_id', 'user_id');
    }

    public function students()
    {
        return $this->hasMany(Student::class, 'current_section_id');
    }

    // Accessors
    public function getCurrentEnrollmentAttribute()
    {
        // Use DB column if set, otherwise count dynamically
        return $this->attributes['current_enrollment'] ?? $this->students()->where('is_active', true)->count();
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForSchoolYear($query, $schoolYearId)
    {
        return $query->where('school_year_id', $schoolYearId);
    }
}