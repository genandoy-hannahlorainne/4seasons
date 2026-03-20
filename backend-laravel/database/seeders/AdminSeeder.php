<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create a default admin account for initial setup
        $adminHash = Hash::make('admin123'); // Use a secure password

        $existingAdmin = DB::table('users')->where('username', 'admin')->first();

        if ($existingAdmin) {
            DB::table('users')
                ->where('username', 'admin')
                ->update([
                    'role_id' => 1,
                    'password_hash' => $adminHash,
                    'email' => 'admin@pdmhs.edu.ph',
                    'phone' => '09171234567',
                    'full_name' => 'System Administrator',
                    'is_active' => 1,
                    'password_must_change' => 0,
                ]);
            return;
        }

        $max = DB::table('users')->max('user_id');
        $id = $max ? $max + 1 : 1;

        DB::table('users')->insert([
            'user_id' => $id,
            'role_id' => 1,
            'username' => 'admin',
            'password_hash' => $adminHash,
            'email' => 'admin@pdmhs.edu.ph',
            'phone' => '09171234567',
            'full_name' => 'System Administrator',
            'is_active' => 1,
            'password_must_change' => 0,
            'created_at' => now(),
        ]);
    }
}
