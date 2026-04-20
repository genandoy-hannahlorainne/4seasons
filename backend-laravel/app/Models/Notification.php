<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $primaryKey = 'notification_id';
    public $timestamps = false; // Disable timestamps since table doesn't have updated_at

    protected $fillable = [
        'parent_id',
        'user_id',
        'student_id',
        'visit_id',
        'channel',
        'message',
        'status',
        'priority',
        'provider_id',
        'sent_at',
        'notification_type',
        'badge_key',
        'metadata',
        'request_data'
    ];

    protected $casts = [
        'sent_at' => 'datetime',
        'created_at' => 'datetime',
        'metadata' => 'array',
        'request_data' => 'array'
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function medicalVisit()
    {
        return $this->belongsTo(MedicalVisit::class, 'visit_id');
    }

    // Scope for badge notifications
    public function scopeBadgeNotifications($query)
    {
        return $query->where('channel', 'System')
                    ->where('message', 'like', '%badge%');
    }

    // Scope for unread notifications
    public function scopeUnread($query)
    {
        return $query->where('status', 'Pending');
    }

    // Mark notification as read
    public function markAsRead()
    {
        $this->update([
            'status' => 'Sent',
            'sent_at' => now()
        ]);
    }
}
