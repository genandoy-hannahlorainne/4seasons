<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    use HasFactory;

    protected $primaryKey = 'student_id';

    protected $fillable = [
        'current_grade_level_id',
        'current_section_id',
        'current_adviser_id',
        'current_school_year_id',
        'enrollment_status',
        'promotion_date',
        'last_promotion_date',
        'student_number',
        'user_id',
        'first_name',
        'middle_name',
        'last_name',
        'birth_date',
        'gender',
        'grade_level',
        'section',
        'address',
        'blood_type',
        'emergency_contact',
        'height_cm',
        'weight_kg',
        'bmi',
        'bmi_category',
        'last_physical_update',
        'is_active'
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'promotion_date' => 'datetime',
            'last_promotion_date' => 'datetime',
            'last_physical_update' => 'datetime',
            'deleted_at' => 'datetime',
            'is_active' => 'boolean',
            'height_cm' => 'decimal:2',
            'weight_kg' => 'decimal:2',
            'bmi' => 'decimal:2'
        ];
    }

    /**
     * Relationships
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function medicalVisits()
    {
        return $this->hasMany(MedicalVisit::class, 'student_id', 'student_id');
    }

    public function allergies()
    {
        return $this->hasMany(Allergy::class, 'student_id', 'student_id');
    }

    public function medicalHistory()
    {
        return $this->hasOne(MedicalHistory::class, 'student_id', 'student_id');
    }

    /**
     * Accessors
     */
    public function getFullNameAttribute()
    {
        return trim($this->first_name . ' ' . $this->middle_name . ' ' . $this->last_name);
    }

    /**
     * Calculate BMI if height and weight are available
     */
    public function calculateBmi()
    {
        if ($this->height_cm && $this->weight_kg) {
            $heightM = $this->height_cm / 100;
            return round($this->weight_kg / ($heightM * $heightM), 2);
        }
        return null;
    }

    /**
     * Get BMI category based on BMI value
     */
    public function getBmiCategoryAttribute()
    {
        $bmi = $this->bmi ?? $this->calculateBmi();
        
        if (!$bmi) return null;
        
        if ($bmi < 18.5) return 'Underweight';
        if ($bmi < 25) return 'Normal weight';
        if ($bmi < 30) return 'Overweight';
        return 'Obese';
    }
}