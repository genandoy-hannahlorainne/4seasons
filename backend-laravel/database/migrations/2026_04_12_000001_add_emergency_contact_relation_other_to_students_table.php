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
            if (!Schema::hasColumn('students', 'emergency_contact_relation_other')) {
                $table->string('emergency_contact_relation_other', 100)
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
            if (Schema::hasColumn('students', 'emergency_contact_relation_other')) {
                $table->dropColumn('emergency_contact_relation_other');
            }
        });
    }
};
