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
        Schema::table('advisers', function (Blueprint $table) {
            if (!Schema::hasColumn('advisers', 'birth_date')) {
                $table->date('birth_date')->nullable()->after('contact_phone');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('advisers', function (Blueprint $table) {
            if (Schema::hasColumn('advisers', 'birth_date')) {
                $table->dropColumn('birth_date');
            }
        });
    }
};
