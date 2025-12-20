<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Create roles table first
        Schema::create('roles', function (Blueprint $table) {
            $table->tinyIncrements('role_id');
            $table->string('role_name', 30)->unique();
        });

        // Insert default roles
        DB::table('roles')->insert([
            ['role_id' => 1, 'role_name' => 'Admin'],
            ['role_id' => 2, 'role_name' => 'Student'],
            ['role_id' => 3, 'role_name' => 'Adviser'],
            ['role_id' => 4, 'role_name' => 'Clinic Staff'],
            ['role_id' => 5, 'role_name' => 'Parent'],
        ]);

        // Update users table to match 4seasons schema
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

        // Create students table
        Schema::create('students', function (Blueprint $table) {
            $table->increments('student_id');
            $table->string('student_number', 30)->unique();
            $table->unsignedBigInteger('user_id')->nullable(); // Changed to match Laravel's users.id
            $table->string('first_name', 80);
            $table->string('middle_name', 80)->nullable();
            $table->string('last_name', 80);
            $table->date('birth_date')->nullable();
            $table->enum('gender', ['M', 'F', 'Other'])->default('Other');
            $table->string('grade_level', 20)->nullable();
            $table->string('section', 50)->nullable();
            $table->text('address')->nullable();
            $table->string('blood_type', 5)->nullable();
            $table->string('emergency_contact', 150)->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->boolean('is_active')->default(1);
            $table->datetime('deleted_at')->nullable();
            
            $table->foreign('user_id')->references('id')->on('users'); // Reference Laravel's users.id
        });

        // Create advisers table
        Schema::create('advisers', function (Blueprint $table) {
            $table->increments('adviser_id');
            $table->unsignedBigInteger('user_id')->nullable(); // Changed to match Laravel's users.id
            $table->string('first_name', 80)->nullable();
            $table->string('last_name', 80)->nullable();
            $table->string('employee_number', 50)->nullable()->unique();
            $table->string('contact_phone', 30)->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->boolean('is_active')->default(1);
            $table->datetime('deleted_at')->nullable();
            
            $table->foreign('user_id')->references('id')->on('users'); // Reference Laravel's users.id
        });

        // Create clinic_staff table
        Schema::create('clinic_staff', function (Blueprint $table) {
            $table->increments('clinic_staff_id');
            $table->unsignedBigInteger('user_id')->nullable(); // Changed to match Laravel's users.id
            $table->string('staff_code', 50)->nullable()->unique();
            $table->string('position', 80)->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->boolean('is_active')->default(1);
            $table->datetime('deleted_at')->nullable();
            
            $table->foreign('user_id')->references('id')->on('users'); // Reference Laravel's users.id
        });

        // Create parents table
        Schema::create('parents', function (Blueprint $table) {
            $table->increments('parent_id');
            $table->unsignedBigInteger('user_id')->nullable(); // Changed to match Laravel's users.id
            $table->string('first_name', 80);
            $table->string('last_name', 80);
            $table->string('relation', 50)->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('email', 150)->nullable();
            $table->text('address')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->boolean('is_active')->default(1);
            $table->datetime('deleted_at')->nullable();
            
            $table->foreign('user_id')->references('id')->on('users'); // Reference Laravel's users.id
        });

        // Create activity_logs table
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->bigIncrements('log_id');
            $table->unsignedBigInteger('user_id')->nullable(); // Changed to match Laravel's users.id
            $table->string('action', 150)->nullable();
            $table->text('details')->nullable();
            $table->string('ip_address', 50)->nullable();
            $table->timestamp('created_at')->useCurrent();
            
            $table->foreign('user_id')->references('id')->on('users'); // Reference Laravel's users.id
        });

        // Create medical_visits table
        Schema::create('medical_visits', function (Blueprint $table) {
            $table->bigIncrements('visit_id');
            $table->unsignedInteger('student_id');
            $table->unsignedInteger('clinic_staff_id')->nullable();
            $table->datetime('visit_datetime');
            $table->enum('visit_type', ['Routine', 'Emergency', 'Follow-up', 'Referral'])->default('Routine');
            $table->string('chief_complaint', 255)->nullable();
            $table->text('notes')->nullable();
            $table->enum('status', ['Open', 'Closed', 'Referred'])->default('Open');
            $table->timestamp('created_at')->useCurrent();
            
            $table->foreign('student_id')->references('student_id')->on('students');
            $table->foreign('clinic_staff_id')->references('clinic_staff_id')->on('clinic_staff');
            $table->index(['student_id', 'visit_datetime']);
        });

        // Create remaining tables (qr_codes, allergies, immunizations, etc.)
        Schema::create('qr_codes', function (Blueprint $table) {
            $table->bigIncrements('qr_id');
            $table->unsignedInteger('student_id')->unique();
            $table->string('qr_token', 255)->unique();
            $table->timestamp('qr_generated_at')->useCurrent();
            $table->datetime('qr_expires_at')->nullable();
            
            $table->foreign('student_id')->references('student_id')->on('students')->onDelete('cascade');
        });

        Schema::create('allergies', function (Blueprint $table) {
            $table->increments('allergy_id');
            $table->unsignedInteger('student_id');
            $table->string('allergy_text', 255)->nullable();
            $table->enum('severity', ['Mild', 'Moderate', 'Severe'])->default('Moderate');
            $table->date('recorded_at')->nullable();
            
            $table->foreign('student_id')->references('student_id')->on('students')->onDelete('cascade');
        });

        Schema::create('immunizations', function (Blueprint $table) {
            $table->increments('immunization_id');
            $table->unsignedInteger('student_id');
            $table->string('vaccine_name', 150)->nullable();
            $table->date('date_administered')->nullable();
            $table->string('administered_by', 150)->nullable();
            $table->string('notes', 255)->nullable();
            
            $table->foreign('student_id')->references('student_id')->on('students')->onDelete('cascade');
        });

        // Create junction tables
        Schema::create('student_adviser', function (Blueprint $table) {
            $table->unsignedInteger('student_id');
            $table->unsignedInteger('adviser_id');
            $table->date('assigned_date')->nullable();
            
            $table->primary(['student_id', 'adviser_id']);
            $table->foreign('student_id')->references('student_id')->on('students')->onDelete('cascade');
            $table->foreign('adviser_id')->references('adviser_id')->on('advisers')->onDelete('cascade');
        });

        Schema::create('student_parent', function (Blueprint $table) {
            $table->unsignedInteger('student_id');
            $table->unsignedInteger('parent_id');
            $table->string('relationship_note', 255)->nullable();
            
            $table->primary(['student_id', 'parent_id']);
            $table->foreign('student_id')->references('student_id')->on('students')->onDelete('cascade');
            $table->foreign('parent_id')->references('parent_id')->on('parents')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_parent');
        Schema::dropIfExists('student_adviser');
        Schema::dropIfExists('immunizations');
        Schema::dropIfExists('allergies');
        Schema::dropIfExists('qr_codes');
        Schema::dropIfExists('medical_visits');
        Schema::dropIfExists('activity_logs');
        Schema::dropIfExists('parents');
        Schema::dropIfExists('clinic_staff');
        Schema::dropIfExists('advisers');
        Schema::dropIfExists('students');
        Schema::dropIfExists('roles');
    }
};