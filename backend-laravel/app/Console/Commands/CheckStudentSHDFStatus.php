<?php

namespace App\Console\Commands;

use App\Models\SchoolYear;
use App\Models\Student;
use App\Models\StudentSHDFStatus;
use Illuminate\Console\Command;

class CheckStudentSHDFStatus extends Command
{
    protected $signature = 'shdf:check-status {student_id}';
    protected $description = 'Check and display SHDF status for a specific student';

    public function handle()
    {
        $studentId = $this->argument('student_id');
        
        $student = Student::where('student_id', $studentId)->first();
        
        if (!$student) {
            $this->error("Student {$studentId} not found!");
            return 1;
        }

        $this->info("Student: {$student->first_name} {$student->last_name} (ID: {$studentId})");
        $this->newLine();

        $schoolYear = SchoolYear::where('is_current', true)->first();
        
        if (!$schoolYear) {
            $this->error("No current school year found!");
            return 1;
        }

        $this->info("Current School Year: {$schoolYear->year_label}");
        $this->newLine();

        $status = StudentSHDFStatus::where('student_id', $studentId)
            ->where('school_year_id', $schoolYear->id)
            ->first();

        if (!$status) {
            $this->warn("No SHDF status record found for this student in current school year.");
            $this->info("This means the student has NOT started the SHDF form yet.");
            return 0;
        }

        $this->info("SHDF Status Record Found:");
        $this->table(
            ['Field', 'Value'],
            [
                ['Basic Completed', $status->basic_completed ? 'YES' : 'NO'],
                ['Basic Completed At', $status->basic_completed_at ?? 'N/A'],
                ['Comprehensive Completed', $status->comprehensive_completed ? 'YES' : 'NO'],
                ['Comprehensive Completed At', $status->comprehensive_completed_at ?? 'N/A'],
                ['Comprehensive Deadline', $status->comprehensive_deadline ?? 'N/A'],
                ['Created At', $status->created_at],
                ['Updated At', $status->updated_at],
            ]
        );

        // Check student basic info
        $this->newLine();
        $this->info("Student Basic Info:");
        $this->table(
            ['Field', 'Value'],
            [
                ['Parent/Guardian Name', $student->parent_guardian_name ?? 'NOT SET'],
                ['Emergency Contact', $student->emergency_contact ?? 'NOT SET'],
                ['Emergency Contact Relation', $student->emergency_contact_relation ?? 'NOT SET'],
                ['Emergency Contact Phone', $student->emergency_contact_phone ?? 'NOT SET'],
                ['Height (cm)', $student->height_cm ?? 'NOT SET'],
                ['Weight (kg)', $student->weight_kg ?? 'NOT SET'],
                ['Blood Type', $student->blood_type ?? 'NOT SET'],
            ]
        );

        // Provide recommendation
        $this->newLine();
        if ($status->basic_completed && !$student->parent_guardian_name) {
            $this->warn("⚠️  INCONSISTENCY DETECTED!");
            $this->warn("Status shows basic_completed = true, but student has no parent_guardian_name.");
            $this->warn("This suggests the status was incorrectly set.");
            $this->newLine();
            
            if ($this->confirm('Do you want to reset the basic_completed status to false?', true)) {
                $status->update([
                    'basic_completed' => false,
                    'basic_completed_at' => null,
                ]);
                $this->info("✓ Status reset successfully. Student can now fill the basic form.");
            }
        } elseif ($status->basic_completed && $student->parent_guardian_name) {
            $this->info("✓ Status is consistent. Student has completed basic info.");
        } else {
            $this->info("✓ Student has not completed basic info yet.");
        }

        return 0;
    }
}
