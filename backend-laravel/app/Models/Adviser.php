<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Adviser extends Model
{
    use HasFactory;

    protected $primaryKey = 'adviser_id';
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'first_name',
        'last_name',
        'employee_number',
        'contact_phone',
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

    public function students()
    {
        return $this->belongsToMany(Student::class, 'student_adviser', 'adviser_id', 'student_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', 1)->whereNull('deleted_at');
    }

    // Accessors
    public function getFullNameAttribute()
    {
        return trim($this->first_name . ' ' . $this->last_name);
    }
}