<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('roles')) {
            return;
        }

        DB::statement("UPDATE roles SET role_name = 'Admin' WHERE role_id = 1");
        DB::statement("UPDATE roles SET role_name = 'Student' WHERE role_id = 2");
        DB::statement("UPDATE roles SET role_name = 'Adviser' WHERE role_id = 3");
        DB::statement("UPDATE roles SET role_name = 'Clinic Staff' WHERE role_id = 4");
        DB::statement("UPDATE roles SET role_name = 'Parent' WHERE role_id = 5");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // no-op
    }
};
