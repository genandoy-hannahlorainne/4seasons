<?php

namespace App\Console\Commands;

use App\Models\Student;
use App\Models\StudentSHDFStatus;
use App\Models\SchoolYear;
use Illuminate\Console\Command;

class MigratePersonalInfoToSHDF extends Command
{
    protected $signature = 'shdf:migrate-personal-info {--dry-run : Run without making changes}';
    protected $description = 'Migrate existing Personal Medical Info to SHDF Basic status';

    public function handle()
    {
        $dryRun = $this->option('dry-run');

        if ($dryRun) {
            $this->warn('🔍 DRY RUN MODE - No changes will be made');
        }

        $schoolYear = SchoolYear::where('is_current', true)->first();

        if (!$schoolYear) {
            $this->error('❌ No current school year found!');
            return 1;
        }

        $this->info("📅 Current School Year: {$schoolYear->year_label}");

        // Find students with personal medical info (emergency contact filled)
        $students = Student::whereNotNull('emergency_contact')
            ->whereNotNull('emergency_contact_phone')
            ->get();

        $this->info("👥 Found {$students->count()} students with personal medical info");

        if ($students->count() === 0) {
            $this->warn('⚠️  No students to migrate');
            return 0;
        }

        if (!$dryRun && !$this->confirm('Do you want to proceed with migration?')) {
            $this->info('Migration cancelled');
            return 0;
        }

        $bar = $this->output->createProgressBar($students->count());
        $bar->start();

        $migrated = 0;
        $skipped = 0;
        $errors = 0;

        foreach ($students as $student) {
            try {
                // Check if already has SHDF status
                $status = StudentSHDFStatus::where('student_id', $student->student_id)
                    ->where('school_year_id', $schoolYear->id)
                    ->first();

                if ($status) {
                    $skipped++;
                    $bar->advance();
                    continue;
                }

                if (!$dryRun) {
                    // Create SHDF status marking basic as complete
                    StudentSHDFStatus::create([
                        'student_id' => $student->student_id,
                        'school_year_id' => $schoolYear->id,
                        'basic_completed' => true,
                        'basic_completed_at' => now(),
                        'comprehensive_completed' => false,
                        'comprehensive_deadline' => now()->addDays(30), // 30 days for existing students
                    ]);
                }

                $migrated++;
            } catch (\Exception $e) {
                $errors++;
                $this->error("\n❌ Error migrating student {$student->student_id}: {$e->getMessage()}");
            }

            $bar->advance();
        }

        $bar->finish();

        $this->newLine(2);
        $this->info('📊 Migration Summary:');
        $this->table(
            ['Status', 'Count'],
            [
                ['Migrated', $migrated],
                ['Skipped (already exists)', $skipped],
                ['Errors', $errors],
                ['Total', $students->count()],
            ]
        );

        if ($dryRun) {
            $this->warn('🔍 This was a DRY RUN - no changes were made');
            $this->info('Run without --dry-run to apply changes');
        } else {
            $this->info('✅ Migration complete!');
            $this->info("📧 {$migrated} students now have SHDF Basic status");
            $this->info("⏰ They have 30 days to complete the comprehensive form");
        }

        return 0;
    }
}
