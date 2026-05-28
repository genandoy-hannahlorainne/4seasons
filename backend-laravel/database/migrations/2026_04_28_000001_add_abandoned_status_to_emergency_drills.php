<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Only run MySQL-specific ALTER when using MySQL
        if (\Illuminate\Support\Facades\Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE emergency_drills MODIFY COLUMN status ENUM('planned','active','completed','cancelled','abandoned') NOT NULL DEFAULT 'planned'");
        }
    }

    public function down(): void
    {
        if (\Illuminate\Support\Facades\Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE emergency_drills MODIFY COLUMN status ENUM('planned','active','completed','cancelled') NOT NULL DEFAULT 'planned'");
        }
    }
};
