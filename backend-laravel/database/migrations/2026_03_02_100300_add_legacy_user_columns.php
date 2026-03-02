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
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'password_changed_at')) {
                $table->timestamp('password_changed_at')->nullable()->after('password_must_change');
            }

            if (!Schema::hasColumn('users', 'created_by_admin_id')) {
                $table->unsignedInteger('created_by_admin_id')->nullable()->after('password_changed_at');
                $table->index('created_by_admin_id');
            }

            if (!Schema::hasColumn('users', 'temp_password')) {
                $table->string('temp_password', 50)->nullable()->after('created_by_admin_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'temp_password')) {
                $table->dropColumn('temp_password');
            }

            if (Schema::hasColumn('users', 'created_by_admin_id')) {
                $table->dropIndex(['created_by_admin_id']);
                $table->dropColumn('created_by_admin_id');
            }
 
            if (Schema::hasColumn('users', 'password_changed_at')) {
                $table->dropColumn('password_changed_at');
            }
        });
    }
};
