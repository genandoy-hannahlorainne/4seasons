<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            ['role_id' => 1, 'role_name' => 'Admin', 'description' => 'System Administrator'],
            ['role_id' => 2, 'role_name' => 'Clinic Staff', 'description' => 'Medical Clinic Staff'],
            ['role_id' => 3, 'role_name' => 'Adviser', 'description' => 'Class Adviser/Teacher'],
            ['role_id' => 4, 'role_name' => 'Student', 'description' => 'Student'],
            ['role_id' => 5, 'role_name' => 'Parent', 'description' => 'Parent/Guardian'],
        ];

        foreach ($roles as $role) {
            DB::table('roles')->updateOrInsert(
                ['role_id' => $role['role_id']],
                $role
            );
        }
    }
}