<?php

namespace App\Policies;

use App\Models\Student;
use App\Models\User;

class SHDFPolicy
{
    public function view(User $user, Student $student): bool
    {
        $role = strtolower($user->role?->role_name ?? '');

        // Admin can view any student
        if ($role === 'admin') {
            return true;
        }

        if (in_array($role, ['clinic_staff', 'clinic staff'])) {
            return true;
        }

        if ($role === 'adviser') {
            return (int) $student->current_adviser_id === (int) $user->user_id;
        }

        if ($role === 'student') {
            return (int) $student->user_id === (int) $user->user_id;
        }

        return false;
    }

    public function submit(User $user, Student $student): bool
    {
        $role = strtolower($user->role?->role_name ?? '');
        
        \Log::info('[SHDF Policy] Submit authorization check', [
            'user_id' => $user->user_id,
            'user_role_raw' => $user->role?->role_name,
            'user_role_lowercase' => $role,
            'student_id' => $student->student_id,
            'student_user_id' => $student->user_id,
        ]);

        // Admin can submit for any student
        if ($role === 'admin') {
            \Log::info('[SHDF Policy] Admin access granted');
            return true;
        }

        if (in_array($role, ['clinic_staff', 'clinic staff'])) {
            \Log::info('[SHDF Policy] Clinic staff access granted');
            return true;
        }

        if ($role === 'student') {
            $canSubmit = (int) $student->user_id === (int) $user->user_id;
            \Log::info('[SHDF Policy] Student access check', [
                'can_submit' => $canSubmit,
                'student_user_id' => $student->user_id,
                'logged_in_user_id' => $user->user_id,
            ]);
            return $canSubmit;
        }

        \Log::warning('[SHDF Policy] Access denied - no matching role', [
            'role' => $role,
        ]);
        
        return false;
    }
}
