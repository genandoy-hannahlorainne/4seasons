<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MedicalHistory extends Model
{
    use HasFactory;

    protected $table = 'medical_history';
    protected $primaryKey = 'history_id';

    protected $fillable = [
        'student_id',
        'condition_asthma',
        'condition_diabetes',
        'condition_heart_problem',
        'condition_hypertension',
        'condition_seizure_disorder',
        'condition_bleeding_disorder',
        'condition_kidney_disease',
        'condition_mental_health',
        'other_conditions',
        'current_medications',
        'family_medical_history',
        'notes',
        // SHDF fields
        'menarche_age',
        'menarche_age_other',
        'allergy_status',
        'condition_error_of_refraction',
        'condition_anemia',
        'condition_gastric_ulcer',
        'condition_anxiety_depression',
        'condition_g6pd',
        'condition_none',
        'condition_other_text',
        'medications_paracetamol',
        'medications_mefenamic',
        'medications_anti_allergy',
        'medications_anti_asthma',
        'medications_loperamide',
        'medications_antacids',
        'medications_or_solution',
        'medications_none',
        'medications_other_text',
        'pwd_status',
        'pwd_congenital_detail',
        'surgery_history',
    ];

    protected function casts(): array
    {
        return [
            'condition_asthma' => 'boolean',
            'condition_diabetes' => 'boolean',
            'condition_heart_problem' => 'boolean',
            'condition_hypertension' => 'boolean',
            'condition_seizure_disorder' => 'boolean',
            'condition_bleeding_disorder' => 'boolean',
            'condition_kidney_disease' => 'boolean',
            'condition_mental_health' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            // SHDF booleans
            'condition_error_of_refraction' => 'boolean',
            'condition_anemia'              => 'boolean',
            'condition_gastric_ulcer'       => 'boolean',
            'condition_anxiety_depression'  => 'boolean',
            'condition_g6pd'                => 'boolean',
            'condition_none'                => 'boolean',
            'medications_paracetamol'       => 'boolean',
            'medications_mefenamic'         => 'boolean',
            'medications_anti_allergy'      => 'boolean',
            'medications_anti_asthma'       => 'boolean',
            'medications_loperamide'        => 'boolean',
            'medications_antacids'          => 'boolean',
            'medications_or_solution'       => 'boolean',
            'medications_none'              => 'boolean',
            'surgery_history'               => 'boolean',
        ];
    }

    /**
     * Relationships
     */
    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id', 'student_id');
    }

    /**
     * Check if student has any medical conditions
     */
    public function hasConditions(): bool
    {
        return $this->condition_asthma ||
               $this->condition_diabetes ||
               $this->condition_heart_problem ||
               $this->condition_hypertension ||
               $this->condition_seizure_disorder ||
               $this->condition_bleeding_disorder ||
               $this->condition_kidney_disease ||
               $this->condition_mental_health ||
               !empty($this->other_conditions);
    }
}
