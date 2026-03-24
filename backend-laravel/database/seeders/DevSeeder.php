<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * DevSeeder — shared test accounts for local development.
 * All accounts have password_must_change = true to simulate the force-change-password flow.
 *
 * Credentials (temp password for all): devpassword
 *
 * | Role         | Username          |
 * |--------------|-------------------|
 * | Admin        | dev.admin         |
 * | Adviser      | dev.adviser       |
 * | Clinic Staff | dev.clinicstaff   |
 * | Student      | dev.student       |
 *
 * Relationship:
 *   dev.adviser  →  adviser of "Grade 7 - Dev Section"
 *   dev.student  →  student in "Grade 7 - Dev Section" under dev.adviser
 */
class DevSeeder extends Seeder
{
    private const TEMP_PASSWORD  = 'devpassword';
    private const GRADE_NAME     = 'Grade 7';
    private const SECTION_NAME   = 'Dev Section';
    private const SCHOOL_YEAR    = '2025-2026';

    public function run(): void
    {
        $password = Hash::make(self::TEMP_PASSWORD);
        $roles    = DB::table('roles')->pluck('role_id', 'role_name');

        // ── 1. Ensure a school year exists ───────────────────────────────────
        $schoolYearId = $this->ensureSchoolYear();

        // ── 2. Ensure Grade 7 exists ─────────────────────────────────────────
        $gradeLevelId = $this->ensureGradeLevel($schoolYearId);

        // ── 3. Create user accounts (skip if already present) ────────────────
        $adviserUserId = $this->ensureUser($roles, 'Adviser',      'dev.adviser',     'dev.adviser@pdmhs.edu.ph',     'Dev Adviser',      $password);
        $adminUserId   = $this->ensureUser($roles, 'Admin',        'dev.admin',       'dev.admin@pdmhs.edu.ph',       'Dev Admin',        $password);
        $staffUserId   = $this->ensureUser($roles, 'Clinic Staff', 'dev.clinicstaff', 'dev.clinicstaff@pdmhs.edu.ph', 'Dev Clinic Staff', $password);
        $studentUserId = $this->ensureUser($roles, 'Student',      'dev.student',     'dev.student@pdmhs.edu.ph',     'Dev Student',      $password);

        // ── 4. Ensure adviser profile ─────────────────────────────────────────
        if ($adviserUserId && !DB::table('advisers')->where('user_id', $adviserUserId)->exists()) {
            DB::table('advisers')->insert([
                'adviser_id'  => (DB::table('advisers')->max('adviser_id') ?? 0) + 1,
                'user_id'     => $adviserUserId,
                'employee_id' => 'DEV-ADV-001',
                'is_active'   => true,
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);
            $this->command->info('DevSeeder: Created adviser profile for dev.adviser.');
        }

        // ── 5. Ensure clinic staff profile ────────────────────────────────────
        if ($staffUserId && !DB::table('clinic_staff')->where('user_id', $staffUserId)->exists()) {
            DB::table('clinic_staff')->insert([
                'clinic_staff_id' => (DB::table('clinic_staff')->max('clinic_staff_id') ?? 0) + 1,
                'user_id'         => $staffUserId,
                'staff_id'        => 'DEV-STF-001',
                'position'        => 'School Nurse',
                'is_active'       => true,
                'created_at'      => now(),
                'updated_at'      => now(),
            ]);
            $this->command->info('DevSeeder: Created clinic staff profile for dev.clinicstaff.');
        }

        // ── 6. Ensure "Grade 7 - Dev Section" assigned to dev.adviser ─────────
        $sectionId = $this->ensureSection($gradeLevelId, $schoolYearId, $adviserUserId);

        // ── 7. Always re-link student → adviser + section (even if already exists)
        if ($studentUserId) {
            $this->ensureStudentProfile($studentUserId, $adviserUserId, $sectionId, $gradeLevelId, $schoolYearId);
        }

        // ── 8. Always re-link section → adviser (in case it was overwritten) ──
        if ($adviserUserId && $sectionId) {
            DB::table('sections')->where('id', $sectionId)->update(['adviser_id' => $adviserUserId]);
        }

        $this->command->info('DevSeeder: Done. Temp password for all accounts: ' . self::TEMP_PASSWORD);
        $this->command->info('DevSeeder: dev.student is enrolled in "' . self::GRADE_NAME . ' - ' . self::SECTION_NAME . '" under dev.adviser.');
    }

    // ─────────────────────────────────────────────────────────────────────────

    private function ensureSchoolYear(): int
    {
        $existing = DB::table('school_years')->where('year_name', self::SCHOOL_YEAR)->value('id');
        if ($existing) {
            return $existing;
        }

        $id = (DB::table('school_years')->max('id') ?? 0) + 1;
        DB::table('school_years')->insert([
            'id'         => $id,
            'year_name'  => self::SCHOOL_YEAR,
            'is_current' => !DB::table('school_years')->where('is_current', true)->exists(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->command->info('DevSeeder: Created school year ' . self::SCHOOL_YEAR . '.');
        return $id;
    }

    private function ensureGradeLevel(int $schoolYearId): int
    {
        // Try to find by level_name
        $existing = DB::table('grade_levels')->where('level_name', self::GRADE_NAME)->value('id');
        if ($existing) {
            return $existing;
        }

        $id = (DB::table('grade_levels')->max('id') ?? 0) + 1;
        DB::table('grade_levels')->insert([
            'id'           => $id,
            'level_name'   => self::GRADE_NAME,
            'level_number' => 7,
            'created_at'   => now(),
            'updated_at'   => now(),
        ]);
        $this->command->info('DevSeeder: Created grade level ' . self::GRADE_NAME . '.');
        return $id;
    }

    private function ensureSection(int $gradeLevelId, int $schoolYearId, ?int $adviserUserId): int
    {
        // Look for existing dev section
        $existing = DB::table('sections')
            ->where('section_name', self::SECTION_NAME)
            ->where('grade_level_id', $gradeLevelId)
            ->value('id');

        if ($existing) {
            // Make sure adviser is assigned
            if ($adviserUserId) {
                DB::table('sections')
                    ->where('id', $existing)
                    ->update(['adviser_id' => $adviserUserId]);
            }
            return $existing;
        }

        $id = (DB::table('sections')->max('id') ?? 0) + 1;
        DB::table('sections')->insert([
            'id'             => $id,
            'section_name'   => self::SECTION_NAME,
            'grade_level_id' => $gradeLevelId,
            'school_year_id' => $schoolYearId,
            'adviser_id'     => $adviserUserId,
            'capacity'       => 50,
            'is_active'      => true,
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);
        $this->command->info('DevSeeder: Created section "' . self::GRADE_NAME . ' - ' . self::SECTION_NAME . '" assigned to dev.adviser.');
        return $id;
    }

    private function ensureStudentProfile(int $userId, ?int $adviserUserId, int $sectionId, int $gradeLevelId, int $schoolYearId): void
    {
        if (DB::table('students')->where('user_id', $userId)->exists()) {
            // Update existing student to ensure correct links
            DB::table('students')->where('user_id', $userId)->update([
                'current_adviser_id'     => $adviserUserId,
                'current_section_id'     => $sectionId,
                'current_grade_level_id' => $gradeLevelId,
                'current_school_year_id' => $schoolYearId,
                'grade_level'            => self::GRADE_NAME,
                'section'                => self::SECTION_NAME,
            ]);
            $this->command->info('DevSeeder: Updated dev.student links (adviser + section).');
            return;
        }

        $studentId = (DB::table('students')->max('student_id') ?? 0) + 1;

        DB::table('students')->insert([
            'student_id'             => $studentId,
            'user_id'                => $userId,
            'student_number'         => 'DEV-STU-001',
            'first_name'             => 'Dev',
            'last_name'              => 'Student',
            'gender'                 => 'M',
            'grade_level'            => self::GRADE_NAME,
            'section'                => self::SECTION_NAME,
            'current_grade_level_id' => $gradeLevelId,
            'current_section_id'     => $sectionId,
            'current_adviser_id'     => $adviserUserId,
            'current_school_year_id' => $schoolYearId,
            'is_active'              => true,
            'created_at'             => now(),
        ]);
        $this->command->info('DevSeeder: Created student profile for dev.student.');
    }

    /**
     * Create a user if they don't exist yet. Returns the user_id (new or existing).
     */
    private function ensureUser(array|\Illuminate\Support\Collection $roles, string $role, string $username, string $email, string $name, string $password): ?int
    {
        $existing = DB::table('users')->where('username', $username)->value('user_id');
        if ($existing) {
            $this->command->info("DevSeeder: {$username} already exists, skipping user creation.");
            return $existing;
        }

        $roleId = is_array($roles) ? ($roles[$role] ?? null) : ($roles[$role] ?? null);
        if (!$roleId) {
            $this->command->warn("DevSeeder: Role '{$role}' not found, skipping {$username}.");
            return null;
        }

        $userId = (DB::table('users')->max('user_id') ?? 0) + 1;

        DB::table('users')->insert([
            'user_id'              => $userId,
            'role_id'              => $roleId,
            'username'             => $username,
            'password_hash'        => $password,
            'email'                => $email,
            'full_name'            => $name,
            'is_active'            => true,
            'password_must_change' => true,
            'created_at'           => now(),
        ]);

        $this->command->info("DevSeeder: Created user {$username} ({$role}).");
        return $userId;
    }
}
