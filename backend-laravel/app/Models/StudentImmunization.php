<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentImmunization extends Model
{
    protected $table = 'student_immunizations';

    protected $fillable = [
        'student_id',
        'bcg',
        'diphtheria_pertussis',
        'oral_polio',
        'mmr',
        'chicken_pox',
        'hepatitis_b',
        'tetanus_toxoid',
        'flu',
        'pneumococcal',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id', 'student_id');
    }
}
