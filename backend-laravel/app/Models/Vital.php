<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vital extends Model
{
    use HasFactory;

    protected $primaryKey = 'vitals_id';
    public $timestamps = false; // Using custom recorded_at field

    protected $fillable = [
        'visit_id',
        'temperature_c',
        'bp_systolic',
        'bp_diastolic',
        'pulse_rate',
        'respiration_rate',
        'height_cm',
        'weight_kg',
        'bmi',
        'bmi_category',
        'notes',
        'recorded_at'
    ];

    protected function casts(): array
    {
        return [
            'temperature_c' => 'decimal:2',
            'bp_systolic' => 'integer',
            'bp_diastolic' => 'integer',
            'pulse_rate' => 'integer',
            'respiration_rate' => 'integer',
            'height_cm' => 'decimal:2',
            'weight_kg' => 'decimal:2',
            'bmi' => 'decimal:2',
            'recorded_at' => 'datetime'
        ];
    }

    /**
     * Relationships
     */
    public function medicalVisit()
    {
        return $this->belongsTo(MedicalVisit::class, 'visit_id', 'visit_id');
    }
}