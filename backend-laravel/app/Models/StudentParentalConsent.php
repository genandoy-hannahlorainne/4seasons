<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentParentalConsent extends Model
{
    protected $table = 'student_parental_consent';

    protected $fillable = [
        'student_id',
        'school_year_id',
        'information_certified',
        'deworming_consent',
        'deworming_refusal_reason',
        'deworming_refusal_other',
        'mrtd_consent',
        'wifa_consent',
        'signature_file_path',
        'signature_file_type',
        'submitted_at',
    ];

    protected $casts = [
        'information_certified' => 'boolean',
        'submitted_at'          => 'datetime',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id', 'student_id');
    }

    public function schoolYear(): BelongsTo
    {
        return $this->belongsTo(SchoolYear::class, 'school_year_id');
    }
}
