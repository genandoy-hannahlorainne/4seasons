<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    use HasFactory;

    protected $primaryKey = 'student_id';
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'student_number',
        'first_name',
        'middle_name',
        'last_name',
        'birth_date',
        'gender',
        'grade_level',
        'section',
        'address',
        'blood_type',
        'emergency_contact',
        'is_active'
    ];

    protected $casts = [
        'birth_date' => 'date',
        'is_active' => 'boolean',
        'deleted_at' => 'datetime'
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function advisers()
    {
        return $this->belongsToMany(Adviser::class, 'student_adviser', 'student_id', 'adviser_id');
    }

    public function parents()
    {
        return $this->belongsToMany(ParentModel::class, 'student_parent', 'student_id', 'parent_id');
    }

    public function medicalVisits()
    {
        return $this->hasMany(MedicalVisit::class, 'student_id', 'student_id');
    }

    public function allergies()
    {
        return $this->hasMany(Allergy::class, 'student_id', 'student_id');
    }

    public function immunizations()
    {
        return $this->hasMany(Immunization::class, 'student_id', 'student_id');
    }

    public function qrCode()
    {
        return $this->hasOne(QRCode::class, 'student_id', 'student_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', 1)->whereNull('deleted_at');
    }

    // Accessors
    public function getFullNameAttribute()
    {
        return trim($this->first_name . ' ' . $this->middle_name . ' ' . $this->last_name);
    }
}