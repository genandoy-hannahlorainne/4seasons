<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seeds that are safe to run on every boot (all idempotent).
     * - RoleSeeder:    uses updateOrInsert, always safe
     * - AdminSeeder:   guards with existence check, always safe
     * - SectionSeeder: guards with existence check, always safe
     *
     * FacultySeeder, ClinicStaffSeeder, StudentSeeder are no-ops
     * (accounts are created by admin through the UI).
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            AdminSeeder::class,
            SectionSeeder::class,
        ]);
    }
}
