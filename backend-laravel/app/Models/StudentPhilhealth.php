<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentPhilhealth extends Model
{
    protected $table = 'student_philhealth';

    protected $fillable = [
        'student_id',
        'learner_philhealth_id',
        'parent_philhealth_id',
        'parent_philhealth_name',
        'parent_relationship',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id', 'student_id');
    }
}
