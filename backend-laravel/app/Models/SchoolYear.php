<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SchoolYear extends Model
{
    use HasFactory;

    protected $table = 'school_years';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'year_name',
        'start_date',
        'end_date',
        'is_current',
        'is_active'
    ];

    protected $casts = [
        'is_current' => 'boolean',
        'is_active' => 'boolean',
        'start_date' => 'date',
        'end_date' => 'date'
    ];

    // Relationships
    public function sections()
    {
        return $this->hasMany(Section::class, 'school_year_id');
    }

    public function students()
    {
        return $this->hasMany(Student::class, 'current_school_year_id');
    }

    // Scopes
    public function scopeCurrent($query)
    {
        return $query->where('is_current', true);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}