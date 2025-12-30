<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QRCode extends Model
{
    use HasFactory;

    protected $table = 'qr_codes';
    protected $primaryKey = 'qr_id';
    public $timestamps = false;

    protected $fillable = [
        'student_id',
        'qr_token',
        'qr_generated_at',
        'qr_expires_at'
    ];

    protected $casts = [
        'qr_generated_at' => 'datetime',
        'qr_expires_at' => 'datetime'
    ];

    // Relationships
    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id', 'student_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('qr_expires_at', '>', now());
    }
}