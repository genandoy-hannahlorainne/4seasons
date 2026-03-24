<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_philhealth', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('student_id')->unique();
            $table->string('learner_philhealth_id', 12)->nullable();
            $table->string('parent_philhealth_id', 12)->nullable();
            $table->string('parent_philhealth_name', 150)->nullable();
            $table->enum('parent_relationship', ['mother', 'father', 'other'])->nullable();
            $table->timestamps();

            $table->foreign('student_id')->references('student_id')->on('students')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_philhealth');
    }
};
