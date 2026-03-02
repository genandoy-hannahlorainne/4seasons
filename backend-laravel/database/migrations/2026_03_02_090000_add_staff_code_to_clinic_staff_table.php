<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasColumn('clinic_staff', 'staff_code')) {
            Schema::table('clinic_staff', function (Blueprint $table) {
                $table->string('staff_code', 50)->nullable()->after('user_id');
                $table->unique('staff_code', 'clinic_staff_staff_code_unique');
            });
        }

        if (Schema::hasColumn('clinic_staff', 'staff_id') && Schema::hasColumn('clinic_staff', 'staff_code')) {
            DB::statement("UPDATE clinic_staff SET staff_code = staff_id WHERE staff_code IS NULL AND staff_id IS NOT NULL");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('clinic_staff', 'staff_code')) {
            Schema::table('clinic_staff', function (Blueprint $table) {
                $table->dropUnique('clinic_staff_staff_code_unique');
                $table->dropColumn('staff_code');
            });
        }
    }
};
