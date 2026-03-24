<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentFamilyHistory extends Model
{
    protected $table = 'student_family_history';

    protected $fillable = [
        'student_id',
        'condition_tuberculosis',
        'condition_cancer',
        'condition_stroke',
        'condition_hypertension',
        'condition_diabetes',
        'condition_pneumonia',
        'condition_gastric_ulcer',
        'condition_anxiety_depression',
        'condition_none',
        'condition_other_text',
        'smoke_exposure',
        'is_4ps_beneficiary',
        'is_sbfp_beneficiary',
    ];

    protected $casts = [
        'condition_tuberculosis'     => 'boolean',
        'condition_cancer'           => 'boolean',
        'condition_stroke'           => 'boolean',
        'condition_hypertension'     => 'boolean',
        'condition_diabetes'         => 'boolean',
        'condition_pneumonia'        => 'boolean',
        'condition_gastric_ulcer'    => 'boolean',
        'condition_anxiety_depression' => 'boolean',
        'condition_none'             => 'boolean',
        'smoke_exposure'             => 'boolean',
        'is_4ps_beneficiary'         => 'boolean',
        'is_sbfp_beneficiary'        => 'boolean',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id', 'student_id');
    }
}
