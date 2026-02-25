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
        Schema::create('students', function (Blueprint $table) {
            $table->integer('student_id', false, true)->primary();
            $table->integer('current_grade_level_id')->nullable();
            $table->integer('current_section_id')->nullable();
            $table->integer('current_adviser_id', false, true)->nullable();
            $table->integer('current_school_year_id')->nullable();
            $table->enum('enrollment_status', ['active', 'promoted', 'graduated', 'transferred', 'dropped', 'inactive'])->default('active');
            $table->timestamp('promotion_date')->nullable();
            $table->timestamp('last_promotion_date')->nullable();
            $table->string('student_number', 30)->unique();
            $table->integer('user_id', false, true)->nullable();
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
            $table->boolean('is_active')->default(true);
            $table->timestamp('deleted_at')->nullable();
            $table->decimal('height_cm', 5, 2)->nullable()->comment('Height in centimeters');
            $table->decimal('weight_kg', 5, 2)->nullable()->comment('Weight in kilograms');
            $table->decimal('bmi', 4, 2)->nullable()->comment('Body Mass Index');
            $table->string('bmi_category', 20)->nullable()->comment('BMI Category (Underweight, Normal, Overweight, Obese)');
            $table->timestamp('last_physical_update')->nullable()->comment('Last time physical info was updated');
            
            // Medical clearance fields
            $table->enum('general_clearance_status', ['approved', 'pending', 'denied', 'not_required'])->default('not_required')->comment('General clearance status');
            $table->date('clearance_expiry_date')->nullable()->comment('When general clearance expires');
            $table->boolean('requires_special_clearance')->default(false)->comment('Student needs special medical clearance');
            $table->text('clearance_notes')->nullable()->comment('Special clearance requirements or notes');
            
            $table->foreign('user_id')->references('user_id')->on('users');
            $table->index(['student_number']);
            $table->index(['current_grade_level_id']);
            $table->index(['current_section_id']);
            $table->index(['current_adviser_id']);
            $table->index(['enrollment_status']);
            $table->index(['is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
