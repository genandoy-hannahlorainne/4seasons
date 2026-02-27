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
        Schema::create('allergies', function (Blueprint $table) {
            $table->integer('allergy_id', false, true)->primary();
            $table->integer('student_id', false, true);
            $table->string('allergy_name', 100);
            $table->enum('severity', ['mild', 'moderate', 'severe'])->default('mild');
            $table->text('reaction_description')->nullable();
            $table->text('treatment_notes')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            
            $table->foreign('student_id')->references('student_id')->on('students');
            $table->index(['student_id']);
            $table->index(['severity']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('allergies');
    }
};
