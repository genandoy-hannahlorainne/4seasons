<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Student;
use App\Models\User;

class FixStudentUserMapping extends Command
{
    protected $signature = 'fix:student-user {student_id} {user_id}';
    protected $description = 'Fix student user_id mapping';

    public function handle()
    {
        $studentId = $this->argument('student_id');
        $userId = $this->argument('user_id');

        $student = Student::where('student_id', $studentId)->first();
        if (!$student) {
            $this->error("Student {$studentId} not found!");
            return 1;
        }

        $user = User::where('user_id', $userId)->first();
        if (!$user) {
            $this->error("User {$userId} not found!");
            return 1;
        }

        $this->info("Student: {$student->first_name} {$student->last_name} (student_id: {$studentId})");
        $this->info("User: {$user->full_name} (user_id: {$userId})");
        $this->info("Current student user_id: " . ($student->user_id ?? 'NULL'));

        $student->update(['user_id' => $userId]);
        $this->info("Updated student user_id to {$userId}");

        return 0;
    }
}
