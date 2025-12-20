<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Check if roles table exists and has data, if not create it
        if (!Schema::hasTable('roles')) {
            Schema::create('roles', function (Blueprint $table) {
                $table->tinyIncrements('role_id');
                $table->string('role_name', 30)->unique();
            });
        }

        // Insert default roles if they don't exist
        $existingRoles = DB::table('roles')->count();
        if ($existingRoles == 0) {
            DB::table('roles')->insert([
                ['role_id' => 1, 'role_name' => 'Admin'],
                ['role_id' => 2, 'role_name' => 'Student'],
                ['role_id' => 3, 'role_name' => 'Adviser'],
                ['role_id' => 4, 'role_name' => 'Clinic Staff'],
                ['role_id' => 5, 'role_name' => 'Parent'],
            ]);
        }

        // Update users table to match 4seasons schema
        if (!Schema::hasColumn('users', 'role_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn(['name', 'email_verified_at', 'remember_token']);
                $table->unsignedTinyInteger('role_id')->after('id');
                $table->string('username', 100)->unique()->after('role_id');
                $table->string('password_hash', 255)->after('username');
                $table->string('email', 150)->nullable()->change();
                $table->string('phone', 30)->nullable()->after('email');
                $table->string('full_name', 150)->nullable()->after('phone');
                $table->boolean('is_active')->default(1)->after('updated_at');
                $table->datetime('deleted_at')->nullable()->after('is_active');
                
                $table->foreign('role_id')->references('role_id')->on('roles');
            });
        }

        // Create advisers table if it doesn't exist
        if (!Schema::hasTable('advisers')) {
            Schema::create('advisers', function (Blueprint $table) {
                $table->increments('adviser_id');
                $table->unsignedBigInteger('user_id')->nullable();
                $table->string('first_name', 80)->nullable();
                $table->string('last_name', 80)->nullable();
                $table->string('employee_number', 50)->nullable()->unique();
                $table->string('contact_phone', 30)->nullable();
                $table->timestamp('created_at')->useCurrent();
                $table->boolean('is_active')->default(1);
                $table->datetime('deleted_at')->nullable();
                
                $table->foreign('user_id')->references('user_id')->on('users');
            });
        }

        // Create clinic_staff table if it doesn't exist
        if (!Schema::hasTable('clinic_staff')) {
            Schema::create('clinic_staff', function (Blueprint $table) {
                $table->increments('clinic_staff_id');
                $table->unsignedBigInteger('user_id')->nullable();
                $table->string('staff_code', 50)->nullable()->unique();
                $table->string('position', 80)->nullable();
                $table->timestamp('created_at')->useCurrent();
                $table->boolean('is_active')->default(1);
                $table->datetime('deleted_at')->nullable();
                
                $table->foreign('user_id')->references('user_id')->on('users');
            });
        }

        // Create parents table if it doesn't exist
        if (!Schema::hasTable('parents')) {
            Schema::create('parents', function (Blueprint $table) {
                $table->increments('parent_id');
                $table->unsignedBigInteger('user_id')->nullable();
                $table->string('first_name', 80);
                $table->string('last_name', 80);
                $table->string('relation', 50)->nullable();
                $table->string('phone', 30)->nullable();
                $table->string('email', 150)->nullable();
                $table->text('address')->nullable();
                $table->timestamp('created_at')->useCurrent();
                $table->boolean('is_active')->default(1);
                $table->datetime('deleted_at')->nullable();
                
                $table->foreign('user_id')->references('user_id')->on('users');
            });
        }

        // Create activity_logs table if it doesn't exist
        if (!Schema::hasTable('activity_logs')) {
            Schema::create('activity_logs', function (Blueprint $table) {
                $table->bigIncrements('log_id');
                $table->unsignedBigInteger('user_id')->nullable();
                $table->string('action', 150)->nullable();
                $table->text('details')->nullable();
                $table->string('ip_address', 50)->nullable();
                $table->timestamp('created_at')->useCurrent();
                
                $table->foreign('user_id')->references('user_id')->on('users');
            });
        }

        // Update students table if it exists but doesn't have the right foreign key
        if (Schema::hasTable('students') && !Schema::hasColumn('students', 'user_id')) {
            Schema::table('students', function (Blueprint $table) {
                $table->unsignedBigInteger('user_id')->nullable()->after('student_number');
                $table->foreign('user_id')->references('user_id')->on('users');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
        Schema::dropIfExists('parents');
        Schema::dropIfExists('clinic_staff');
        Schema::dropIfExists('advisers');
        
        if (Schema::hasTable('students')) {
            Schema::table('students', function (Blueprint $table) {
                $table->dropForeign(['user_id']);
                $table->dropColumn('user_id');
            });
        }
        
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropForeign(['role_id']);
                $table->dropColumn(['role_id', 'username', 'password_hash', 'phone', 'full_name', 'is_active', 'deleted_at']);
                $table->string('name')->after('id');
                $table->timestamp('email_verified_at')->nullable()->after('email');
                $table->string('remember_token', 100)->nullable();
            });
        }
        
        Schema::dropIfExists('roles');
    }
};