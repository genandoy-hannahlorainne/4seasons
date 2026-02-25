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
        Schema::create('medical_history', function (Blueprint $table) {
            $table->bigInteger('history_id', false, true)->primary();
            $table->integer('student_id', false, true);
            $table->boolean('condition_asthma')->default(false);
            $table->boolean('condition_diabetes')->default(false);
            $table->boolean('condition_heart_problem')->default(false);
            $table->boolean('condition_hypertension')->default(false);
            $table->boolean('condition_seizure_disorder')->default(false);
            $table->boolean('condition_bleeding_disorder')->default(false);
            $table->boolean('condition_kidney_disease')->default(false);
            $table->boolean('condition_mental_health')->default(false);
            $table->text('other_conditions')->nullable();
            $table->text('current_medications')->nullable();
            $table->text('family_medical_history')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            
            $table->foreign('student_id')->references('student_id')->on('students');
            $table->unique(['student_id']);
            $table->index(['condition_asthma']);
            $table->index(['condition_diabetes']);
            $table->index(['condition_heart_problem']);
            $table->index(['condition_seizure_disorder']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medical_history');
    }
};
