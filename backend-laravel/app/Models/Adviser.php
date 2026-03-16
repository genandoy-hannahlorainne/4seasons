<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Adviser extends Model
{
    use HasFactory;

    protected $primaryKey = 'adviser_id';

    protected $fillable = [
        'user_id',
        'first_name',
        'last_name',
        'employee_number',
        'employee_id',
        'department',
        'contact_phone',
        'hire_date',
        'is_active',
        'grade_level',
        'section'
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

    public function students()
    {
        return $this->hasMany(Student::class, 'current_adviser_id', 'adviser_id');
    }
}