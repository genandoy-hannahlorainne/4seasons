<?php

namespace App\Console\Commands;

use App\Models\Student;
use App\Models\User;
use Illuminate\Console\Command;

class CheckStudentUserMapping extends Command
{
    protected $signature = 'student:check-user-mapping {student_id}';
    protected $description = 'Check if student is properly mapped to a user account';

    public function handle()
    {
        $studentId = $this->argument('student_id');
        
        $student = Student::where('student_id', $studentId)->first();
        
        if (!$student) {
            $this->error("Student {$studentId} not found!");
            return 1;
        }

        $this->info("Student Information:");
        $this->info("  Student ID: {$student->student_id}");
        $this->info("  Name: {$student->first_name} {$student->last_name}");
        $this->info("  User ID (in students table): " . ($student->user_id ?? 'NULL'));
        $this->newLine();

        if (!$student->user_id) {
            $this->error("⚠️  Student has no user_id assigned!");
            $this->info("This student cannot login or submit forms.");
            $this->newLine();
            
            // Try to find a matching user
            $user = User::where('email', 'like', "%{$student->student_id}%")->first();
            if ($user) {
                $this->info("Found potential matching user:");
                $this->info("  User ID: {$user->user_id}");
                $this->info("  Email: {$user->email}");
                $this->info("  Role: {$user->role?->role_name}");
                $this->newLine();
                
                if ($this->confirm("Link this user to the student?", true)) {
                    $student->update(['user_id' => $user->user_id]);
                    $this->info("✓ Student linked to user successfully!");
                }
            } else {
                $this->warn("No matching user found. You may need to create a user account for this student.");
            }
            
            return 0;
        }

        $user = User::where('user_id', $student->user_id)->first();
        
        if (!$user) {
            $this->error("⚠️  User ID {$student->user_id} not found in users table!");
            $this->error("Student is linked to a non-existent user.");
            return 1;
        }

        $this->info("User Account Information:");
        $this->info("  User ID: {$user->user_id}");
        $this->info("  Email: {$user->email}");
        $this->info("  Role: {$user->role?->role_name}");
        $this->info("  Status: " . ($user->is_active ? 'Active' : 'Inactive'));
        $this->newLine();

        if ($user->role?->role_name !== 'Student') {
            $this->warn("⚠️  User role is '{$user->role?->role_name}', expected 'Student'");
        }

        if (!$user->is_active) {
            $this->warn("⚠️  User account is inactive!");
        }

        $this->info("✓ Student is properly mapped to user account.");
        $this->info("This student should be able to submit SHDF forms.");

        return 0;
    }
}
