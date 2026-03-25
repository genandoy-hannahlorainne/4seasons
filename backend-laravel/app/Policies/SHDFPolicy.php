<?php

namespace App\Policies;

use App\Models\Student;
use App\Models\User;

class SHDFPolicy
{
    public function view(User $user, Student $student): bool
    {
        $role = strtolower($user->role?->role_name ?? '');

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

        if (in_array($role, ['clinic_staff', 'clinic staff'])) {
            return true;
        }

        if ($role === 'student') {
            return (int) $student->user_id === (int) $user->user_id;
        }

        return false;
    }
}
