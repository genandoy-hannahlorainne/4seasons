<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    // Use user_id as primary key (matches existing database)
    protected $primaryKey = 'user_id';

    protected $fillable = [
        'role_id',
        'username',
        'password_hash',
        'email',
        'phone',
        'full_name',
        'is_active'
    ];

    protected $hidden = [
        'password_hash',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_active' => 'boolean',
        'deleted_at' => 'datetime'
    ];

    // Override the password attribute name
    public function getAuthPassword()
    {
        return $this->password_hash;
    }

    // Relationships
    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id', 'role_id');
    }

    public function student()
    {
        return $this->hasOne(Student::class, 'user_id', 'user_id');
    }

    public function adviser()
    {
        return $this->hasOne(Adviser::class, 'user_id', 'user_id');
    }

    public function clinicStaff()
    {
        return $this->hasOne(ClinicStaff::class, 'user_id', 'user_id');
    }

    public function parent()
    {
        return $this->hasOne(ParentModel::class, 'user_id', 'user_id');
    }

    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class, 'user_id', 'user_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', 1)->whereNull('deleted_at');
    }

    public function scopeByRole($query, $roleName)
    {
        return $query->whereHas('role', function ($q) use ($roleName) {
            $q->where('role_name', $roleName);
        });
    }
}