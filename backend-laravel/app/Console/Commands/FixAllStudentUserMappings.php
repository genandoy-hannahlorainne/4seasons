<?php

namespace App\Console\Commands;

use App\Models\Student;
use App\Models\User;
use Illuminate\Console\Command;

class FixAllStudentUserMappings extends Command
{
    protected $signature = 'student:fix-all-user-mappings {--dry-run : Show what would be fixed without making changes}';
    protected $description = 'Fix user_id mappings for all students';

    public function handle()
    {
        $dryRun = $this->option('dry-run');
        
        if ($dryRun) {
            $this->info('DRY RUN MODE - No changes will be made');
            $this->newLine();
        }

        // Get all students
        $students = Student::all();
        $fixed = 0;
        $alreadyCorrect = 0;
        $notFound = 0;

        $this->info("Checking {$students->count()} students...");
        $this->newLine();

        foreach ($students as $student) {
            // Check if student has a user_id
            if ($student->user_id) {
                // Verify the user exists
                $user = User::where('user_id', $student->user_id)->first();
                if ($user) {
                    $alreadyCorrect++;
                    continue;
                }
            }

            // Try to find matching user by email pattern
            // Common patterns: student_id@school.edu, student_id@example.com, etc.
            $user = User::where('email', 'like', "%{$student->student_id}%")
                ->orWhere('email', 'like', "%{$student->first_name}%{$student->last_name}%")
                ->first();

            if ($user) {
                $this->info("Found match for Student {$student->student_id} ({$student->first_name} {$student->last_name})");
                $this->info("  → User: {$user->email} (ID: {$user->user_id})");
                
                if (!$dryRun) {
                    $student->update(['user_id' => $user->user_id]);
                    $this->info("  ✓ Fixed");
                } else {
                    $this->info("  → Would fix");
                }
                
                $fixed++;
            } else {
                $this->warn("No user found for Student {$student->student_id} ({$student->first_name} {$student->last_name})");
                $notFound++;
            }
            
            $this->newLine();
        }

        $this->newLine();
        $this->info('Summary:');
        $this->info("  Already correct: {$alreadyCorrect}");
        $this->info("  Fixed: {$fixed}");
        $this->info("  Not found: {$notFound}");

        if ($dryRun && $fixed > 0) {
            $this->newLine();
            $this->info('Run without --dry-run to apply these changes:');
            $this->info('  php artisan student:fix-all-user-mappings');
        }

        if ($notFound > 0) {
            $this->newLine();
            $this->warn("⚠️  {$notFound} students have no matching user accounts.");
            $this->warn('These students will not be able to login or submit forms.');
            $this->warn('You may need to create user accounts for them manually.');
        }

        return 0;
    }
}
