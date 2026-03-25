<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_family_history', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('student_id')->unique();
            $table->boolean('condition_tuberculosis')->default(false);
            $table->boolean('condition_cancer')->default(false);
            $table->boolean('condition_stroke')->default(false);
            $table->boolean('condition_hypertension')->default(false);
            $table->boolean('condition_diabetes')->default(false);
            $table->boolean('condition_pneumonia')->default(false);
            $table->boolean('condition_gastric_ulcer')->default(false);
            $table->boolean('condition_anxiety_depression')->default(false);
            $table->boolean('condition_none')->default(false);
            $table->text('condition_other_text')->nullable();
            $table->boolean('smoke_exposure')->default(false);
            $table->boolean('is_4ps_beneficiary')->default(false);
            $table->boolean('is_sbfp_beneficiary')->default(false);
            $table->timestamps();

            $table->foreign('student_id')->references('student_id')->on('students')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_family_history');
    }
};
