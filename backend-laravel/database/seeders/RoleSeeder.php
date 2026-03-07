<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $hasDescriptionColumn = Schema::hasColumn('roles', 'description');

        $roles = [
            ['role_id' => 1, 'role_name' => 'Admin', 'description' => 'System Administrator'],
            ['role_id' => 2, 'role_name' => 'Student', 'description' => 'Student'],
            ['role_id' => 3, 'role_name' => 'Adviser', 'description' => 'Class Adviser/Teacher'],
            ['role_id' => 4, 'role_name' => 'Clinic Staff', 'description' => 'Medical Clinic Staff'],
            ['role_id' => 5, 'role_name' => 'Parent', 'description' => 'Parent/Guardian'],
        ];

        foreach ($roles as $role) {
            $values = $hasDescriptionColumn ? $role : [
                'role_id' => $role['role_id'],
                'role_name' => $role['role_name'],
            ];

            DB::table('roles')->updateOrInsert(
                ['role_id' => $role['role_id']],
                $values
            );
        }
    }
}