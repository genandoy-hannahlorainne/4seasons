<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_shdf_status', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('student_id');
            $table->unsignedBigInteger('school_year_id');

            // Stage 1: Basic info (required for QR code)
            $table->boolean('basic_completed')->default(false);
            $table->timestamp('basic_completed_at')->nullable();

            // Stage 2: Comprehensive info (full SHDF)
            $table->boolean('comprehensive_completed')->default(false);
            $table->timestamp('comprehensive_completed_at')->nullable();

            // Deadline tracking
            $table->timestamp('comprehensive_deadline')->nullable();
            $table->boolean('deadline_notified')->default(false);

            $table->timestamps();

            $table->foreign('student_id')->references('student_id')->on('students')->onDelete('cascade');
            $table->foreign('school_year_id')->references('id')->on('school_years')->onDelete('cascade');

            $table->unique(['student_id', 'school_year_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_shdf_status');
    }
};
