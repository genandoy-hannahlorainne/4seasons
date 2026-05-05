<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ClinicStaff extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'clinic_staff';
    protected $primaryKey = 'clinic_staff_id';
    public $timestamps = true;

    protected $fillable = [
        'user_id',
        'staff_id',
        'staff_code',
        'position',
        'is_active'
    ];

    protected function casts(): array
    {
        return [
            'hire_date' => 'date',
            'is_active' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime'
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
        return $this->hasMany(MedicalVisit::class, 'clinic_staff_id', 'clinic_staff_id');
    }
}
