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
        'temperature',
        'blood_pressure',
        'pulse_rate',
        'respiratory_rate',
        'oxygen_saturation',
        'height_cm',
        'weight_kg',
        'bmi',
        'notes',
        'recorded_at'
    ];

    protected function casts(): array
    {
        return [
            'temperature' => 'decimal:1',
            'pulse_rate' => 'integer',
            'respiratory_rate' => 'integer',
            'oxygen_saturation' => 'decimal:2',
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