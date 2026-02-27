<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GradeLevel extends Model
{
    use HasFactory;

    protected $table = 'grade_levels';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'level_name',
        'level_number',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'level_number' => 'integer'
    ];

    // Relationships
    public function sections()
    {
        return $this->hasMany(Section::class, 'grade_level_id');
    }

    public function students()
    {
        return $this->hasMany(Student::class, 'current_grade_level_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('level_number');
    }
}