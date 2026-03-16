<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $adminHash = password_hash('admin_dummy_password', PASSWORD_BCRYPT);

        $existingAdmin = DB::table('users')->where('username', 'admin_dummy')->first();

        if ($existingAdmin) {
            DB::table('users')
                ->where('username', 'admin_dummy')
                ->update([
                    'role_id' => 1,
                    'password_hash' => $adminHash,
                    'email' => 'admin@example.com',
                    'phone' => '0000000000',
                    'full_name' => 'Admin Dummy',
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
            'username' => 'admin_dummy',
            'password_hash' => $adminHash,
            'email' => 'admin@example.com',
            'phone' => '0000000000',
            'full_name' => 'Admin Dummy',
            'is_active' => 1,
            'password_must_change' => 0,
            'created_at' => now(),
        ]);
    }
}
