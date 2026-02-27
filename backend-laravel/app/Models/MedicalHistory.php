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
        'notes'
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
            'updated_at' => 'datetime'
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