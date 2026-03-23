<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * DevSeeder — shared test accounts for local development.
 * All accounts have password_must_change = true to simulate the force-change-password flow.
 *
 * Credentials (temp password for all): Dev@1234
 *
 * | Role         | Username          |
 * |--------------|-------------------|
 * | Clinic Staff | dev.clinicstaff   |
 * | Student      | dev.student       |
 */
class DevSeeder extends Seeder
{
    private const TEMP_PASSWORD = 'Dev@1234';

    public function run(): void
    {
        $password = Hash::make(self::TEMP_PASSWORD);

        $roles = DB::table('roles')->pluck('role_id', 'role_name');

        $accounts = [
            [
                'role'     => 'Clinic Staff',
                'username' => 'dev.clinicstaff',
                'email'    => 'dev.clinicstaff@pdmhs.edu.ph',
                'name'     => 'Dev Clinic Staff',
            ],
            [
                'role'     => 'Student',
                'username' => 'dev.student',
                'email'    => 'dev.student@pdmhs.edu.ph',
                'name'     => 'Dev Student',
            ],
        ];

        foreach ($accounts as $account) {
            $roleId = $roles[$account['role']] ?? null;
            if (!$roleId) {
                $this->command->warn("DevSeeder: Role '{$account['role']}' not found, skipping {$account['username']}.");
                continue;
            }

            $existing = DB::table('users')->where('username', $account['username'])->first();
            if ($existing) {
                $this->command->info("DevSeeder: {$account['username']} already exists, skipping.");
                continue;
            }

            $userId = (DB::table('users')->max('user_id') ?? 0) + 1;

            DB::table('users')->insert([
                'user_id'              => $userId,
                'role_id'              => $roleId,
                'username'             => $account['username'],
                'password_hash'        => $password,
                'email'                => $account['email'],
                'full_name'            => $account['name'],
                'is_active'            => true,
                'password_must_change' => true,   // <-- force change password flow
                'created_at'           => now(),
            ]);

            // Create role-specific profile records
            $this->createRoleProfile($account['role'], $userId, $account['username']);

            $this->command->info("DevSeeder: Created {$account['username']} ({$account['role']}).");
        }

        $this->command->info('DevSeeder: Done. Temp password for all accounts: ' . self::TEMP_PASSWORD);
    }

    private function createRoleProfile(string $role, int $userId, string $username): void
    {
        match ($role) {
            'Adviser' => DB::table('advisers')->insert([
                'adviser_id'  => (DB::table('advisers')->max('adviser_id') ?? 0) + 1,
                'user_id'     => $userId,
                'employee_id' => 'DEV-ADV-001',
                'is_active'   => true,
                'created_at'  => now(),
                'updated_at'  => now(),
            ]),

            'Clinic Staff' => DB::table('clinic_staff')->insert([
                'clinic_staff_id' => (DB::table('clinic_staff')->max('clinic_staff_id') ?? 0) + 1,
                'user_id'         => $userId,
                'staff_id'        => 'DEV-STF-001',
                'position'        => 'School Nurse',
                'is_active'       => true,
                'created_at'      => now(),
                'updated_at'      => now(),
            ]),

            'Student' => $this->createStudentProfile($userId),

            default => null,
        };
    }

    private function createStudentProfile(int $userId): void
    {
        $schoolYearId = DB::table('school_years')->where('is_current', true)->value('id');
        $sectionId    = DB::table('sections')->where('is_active', true)->value('id');
        $gradeLevel   = DB::table('sections')
            ->join('grade_levels', 'sections.grade_level_id', '=', 'grade_levels.id')
            ->where('sections.id', $sectionId)
            ->value('grade_levels.level_name');

        $studentId = (DB::table('students')->max('student_id') ?? 0) + 1;

        DB::table('students')->insert([
            'student_id'             => $studentId,
            'user_id'                => $userId,
            'student_number'         => 'DEV-STU-001',
            'first_name'             => 'Dev',
            'last_name'              => 'Student',
            'gender'                 => 'M',
            'grade_level'            => $gradeLevel ?? 'Grade 7',
            'section'                => 'Dev Section',
            'current_grade_level_id' => DB::table('grade_levels')->value('id'),
            'current_section_id'     => $sectionId,
            'current_school_year_id' => $schoolYearId,
            'is_active'              => true,
            'created_at'             => now(),
        ]);
    }
}
