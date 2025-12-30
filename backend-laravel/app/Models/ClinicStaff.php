<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClinicStaff extends Model
{
    use HasFactory;

    protected $table = 'clinic_staff';
    protected $primaryKey = 'clinic_staff_id';
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'staff_code',
        'position',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'deleted_at' => 'datetime'
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function medicalVisits()
    {
        return $this->hasMany(MedicalVisit::class, 'clinic_staff_id', 'clinic_staff_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', 1)->whereNull('deleted_at');
    }
}