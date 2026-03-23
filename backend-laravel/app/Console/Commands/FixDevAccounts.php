<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class FixDevAccounts extends Command
{
    protected $signature   = 'dev:fix-accounts';
    protected $description = 'Link dev.student to dev.adviser under Grade 7 - Dev Section';

    public function handle(): int
    {
        $adviser = DB::table('users')->where('username', 'dev.adviser')->first();
        $student = DB::table('students')->where('student_number', 'DEV-STU-001')->first();

        if (!$adviser) {
            $this->error('dev.adviser user not found. Run: php artisan db:seed --class=DevSeeder');
            return 1;
        }
        if (!$student) {
            $this->error('DEV-STU-001 student not found. Run: php artisan db:seed --class=DevSeeder');
            return 1;
        }

        // Ensure Grade 7 grade level exists
        $gradeLevelId = DB::table('grade_levels')->where('level_name', 'Grade 7')->value('id');
        if (!$gradeLevelId) {
            $gradeLevelId = (DB::table('grade_levels')->max('id') ?? 0) + 1;
            DB::table('grade_levels')->insert([
                'id'           => $gradeLevelId,
                'level_name'   => 'Grade 7',
                'level_number' => 7,
                'created_at'   => now(),
                'updated_at'   => now(),
            ]);
            $this->info('Created Grade 7 grade level.');
        }

        // Ensure school year
        $schoolYearId = DB::table('school_years')->where('is_current', true)->value('id')
            ?? DB::table('school_years')->value('id');

        // Ensure "Dev Section" exists under Grade 7, assigned to dev.adviser
        $sectionId = DB::table('sections')
            ->where('section_name', 'Dev Section')
            ->where('grade_level_id', $gradeLevelId)
            ->value('id');

        if (!$sectionId) {
            $sectionId = (DB::table('sections')->max('id') ?? 0) + 1;
            DB::table('sections')->insert([
                'id'             => $sectionId,
                'section_name'   => 'Dev Section',
                'grade_level_id' => $gradeLevelId,
                'school_year_id' => $schoolYearId,
                'adviser_id'     => $adviser->user_id,
                'capacity'       => 50,
                'is_active'      => true,
                'created_at'     => now(),
                'updated_at'     => now(),
            ]);
            $this->info('Created section "Grade 7 - Dev Section".');
        } else {
            DB::table('sections')->where('id', $sectionId)->update([
                'adviser_id' => $adviser->user_id,
            ]);
            $this->info('Updated section adviser_id to dev.adviser.');
        }

        // Update student to point to dev.adviser and the section
        DB::table('students')->where('student_number', 'DEV-STU-001')->update([
            'current_adviser_id'     => $adviser->user_id,
            'current_section_id'     => $sectionId,
            'current_grade_level_id' => $gradeLevelId,
            'current_school_year_id' => $schoolYearId,
            'grade_level'            => 'Grade 7',
            'section'                => 'Dev Section',
        ]);

        $this->info('Updated dev.student:');
        $this->line("  current_adviser_id  = {$adviser->user_id} (dev.adviser)");
        $this->line("  current_section_id  = {$sectionId} (Dev Section)");
        $this->line("  grade_level         = Grade 7");
        $this->line("  section             = Dev Section");
        $this->newLine();
        $this->info('Done! dev.student is now under dev.adviser in Grade 7 - Dev Section.');

        return 0;
    }
}
