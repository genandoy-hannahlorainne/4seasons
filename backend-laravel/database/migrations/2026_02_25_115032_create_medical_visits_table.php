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
        Schema::create('medical_visits', function (Blueprint $table) {
            $table->bigInteger('visit_id', false, true)->primary();
            $table->integer('student_id', false, true);
            $table->integer('clinic_staff_id', false, true)->nullable();
            $table->timestamp('visit_datetime')->useCurrent();
            $table->text('chief_complaint')->nullable();
            $table->text('diagnosis')->nullable();
            $table->text('treatment_given')->nullable();
            $table->text('medications_given')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('follow_up_required')->default(false);
            $table->date('follow_up_date')->nullable();
            $table->boolean('parent_notified')->default(false);
            $table->boolean('adviser_notified')->default(false);
            $table->boolean('is_emergency')->default(false);
            $table->enum('visit_type', ['routine', 'emergency', 'follow_up', 'screening'])->default('routine');
            $table->enum('status', ['active', 'completed', 'cancelled'])->default('active');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            
            $table->foreign('student_id')->references('student_id')->on('students');
            $table->index(['student_id']);
            $table->index(['visit_datetime']);
            $table->index(['is_emergency']);
            $table->index(['visit_type']);
            $table->index(['status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medical_visits');
    }
};
