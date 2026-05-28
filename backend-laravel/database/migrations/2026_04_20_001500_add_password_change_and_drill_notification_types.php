<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Add new notification types for password change requests
        DB::statement("ALTER TABLE notifications MODIFY COLUMN notification_type VARCHAR(50) NULL");

        // Add request_data column to store additional request information
        Schema::table('notifications', function (Blueprint $table) {
            $table->json('request_data')->nullable()->after('metadata');
        });
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropColumn('request_data');
        });
    }
};
