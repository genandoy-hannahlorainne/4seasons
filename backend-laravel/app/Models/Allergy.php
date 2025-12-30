<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Allergy extends Model
{
    use HasFactory;

    protected $primaryKey = 'allergy_id';
    public $timestamps = false;

    protected $fillable = [
        'student_id',
        'allergy_text',
        'severity',
        'recorded_at'
    ];

    protected $casts = [
        'recorded_at' => 'date'
    ];

    // Relationships
    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id', 'student_id');
    }
}