<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_immunizations', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('student_id')->unique();
            $table->enum('bcg', ['yes', 'no', 'na'])->nullable();
            $table->enum('diphtheria_pertussis', ['yes', 'no', 'na'])->nullable();
            $table->enum('oral_polio', ['yes', 'no', 'na'])->nullable();
            $table->enum('mmr', ['yes', 'no', 'na'])->nullable();
            $table->enum('chicken_pox', ['yes', 'no', 'na'])->nullable();
            $table->enum('hepatitis_b', ['yes', 'no', 'na'])->nullable();
            $table->enum('tetanus_toxoid', ['yes', 'no', 'na'])->nullable();
            $table->enum('flu', ['yes', 'no', 'na'])->nullable();
            $table->enum('pneumococcal', ['yes', 'no', 'na'])->nullable();
            $table->timestamps();

            $table->foreign('student_id')->references('student_id')->on('students')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_immunizations');
    }
};
