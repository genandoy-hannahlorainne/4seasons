<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            if (!Schema::hasColumn('students', 'emergency_contact_relation')) {
                $table->string('emergency_contact_relation', 100)
                    ->nullable()
                    ->after('emergency_contact');
            }

            if (!Schema::hasColumn('students', 'emergency_contact_phone')) {
                $table->string('emergency_contact_phone', 20)
                    ->nullable()
                    ->after('emergency_contact_relation');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            if (Schema::hasColumn('students', 'emergency_contact_phone')) {
                $table->dropColumn('emergency_contact_phone');
            }

            if (Schema::hasColumn('students', 'emergency_contact_relation')) {
                $table->dropColumn('emergency_contact_relation');
            }
        });
    }
};
