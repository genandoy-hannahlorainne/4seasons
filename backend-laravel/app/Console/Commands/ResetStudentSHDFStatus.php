<?php

namespace App\Console\Commands;

use App\Models\SchoolYear;
use App\Models\Student;
use App\Models\StudentSHDFStatus;
use Illuminate\Console\Command;

class ResetStudentSHDFStatus extends Command
{
    protected $signature = 'shdf:reset-status {student_id} {--stage=basic}';
    protected $description = 'Reset SHDF status for a specific student';

    public function handle()
    {
        $studentId = $this->argument('student_id');
        $stage = $this->option('stage');
        
        $student = Student::where('student_id', $studentId)->first();
        
        if (!$student) {
            $this->error("Student {$studentId} not found!");
            return 1;
        }

        $schoolYear = SchoolYear::where('is_current', true)->first();
        
        if (!$schoolYear) {
            $this->error("No current school year found!");
            return 1;
        }

        $status = StudentSHDFStatus::where('student_id', $studentId)
            ->where('school_year_id', $schoolYear->id)
            ->first();

        if (!$status) {
            $this->warn("No SHDF status record found for this student.");
            return 0;
        }

        $this->info("Student: {$student->first_name} {$student->last_name} (ID: {$studentId})");
        $this->info("Current Status:");
        $this->info("  Basic Completed: " . ($status->basic_completed ? 'YES' : 'NO'));
        $this->info("  Comprehensive Completed: " . ($status->comprehensive_completed ? 'YES' : 'NO'));
        $this->newLine();

        if ($stage === 'basic') {
            if (!$this->confirm("Reset basic_completed to false for student {$studentId}?", true)) {
                $this->info("Operation cancelled.");
                return 0;
            }

            $status->update([
                'basic_completed' => false,
                'basic_completed_at' => null,
            ]);

            $this->info("✓ Basic status reset successfully.");
            $this->info("Student can now access and fill the basic SHDF form.");
        } elseif ($stage === 'comprehensive') {
            if (!$this->confirm("Reset comprehensive_completed to false for student {$studentId}?", true)) {
                $this->info("Operation cancelled.");
                return 0;
            }

            $status->update([
                'comprehensive_completed' => false,
                'comprehensive_completed_at' => null,
            ]);

            $this->info("✓ Comprehensive status reset successfully.");
            $this->info("Student can now access and fill the comprehensive SHDF form.");
        } elseif ($stage === 'all') {
            if (!$this->confirm("Reset ALL SHDF status for student {$studentId}?", true)) {
                $this->info("Operation cancelled.");
                return 0;
            }

            $status->delete();

            $this->info("✓ All SHDF status deleted successfully.");
            $this->info("Student can now start fresh with the SHDF forms.");
        } else {
            $this->error("Invalid stage. Use: basic, comprehensive, or all");
            return 1;
        }

        return 0;
    }
}
