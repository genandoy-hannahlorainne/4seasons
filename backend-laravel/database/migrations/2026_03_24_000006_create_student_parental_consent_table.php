<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_parental_consent', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('student_id');
            $table->unsignedBigInteger('school_year_id');
            $table->boolean('information_certified')->default(false);
            $table->enum('deworming_consent', ['oo', 'hindi']);
            $table->enum('deworming_refusal_reason', [
                'takot',
                'regular_pribado',
                'nabigyan_barangay',
                'allergy_reaksyon',
                'other',
            ])->nullable();
            $table->string('deworming_refusal_other', 255)->nullable();
            $table->enum('mrtd_consent', ['oo', 'hindi', 'not_applicable'])->default('not_applicable');
            $table->enum('wifa_consent', ['oo', 'hindi', 'not_applicable'])->default('not_applicable');
            $table->string('signature_file_path', 500)->nullable();
            $table->string('signature_file_type', 10)->nullable();
            $table->timestamp('submitted_at')->nullable();

            $table->timestamps();
            $table->unique(['student_id', 'school_year_id']);

            $table->foreign('student_id')->references('student_id')->on('students')->cascadeOnDelete();
            $table->foreign('school_year_id')->references('id')->on('school_years')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_parental_consent');
    }
};
