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
        Schema::create('drill_participants', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('drill_id');
            $table->unsignedInteger('student_id'); // Changed to match students.student_id
            $table->enum('role', ['injured', 'rescuer', 'observer', 'evacuee'])->default('evacuee');
            $table->enum('status', ['assigned', 'scanned', 'rescued', 'safe'])->default('assigned');
            $table->text('injury_simulation')->nullable(); // Description of simulated injury
            $table->enum('severity', ['minor', 'moderate', 'severe', 'critical'])->nullable();
            $table->timestamp('assigned_at');
            $table->timestamp('first_scan_at')->nullable();
            $table->timestamp('rescued_at')->nullable();
            $table->integer('response_time_seconds')->nullable();
            $table->unsignedInteger('rescuer_id')->nullable(); // Changed to match users.user_id
            $table->json('scan_history')->nullable(); // Multiple scans tracking
            $table->timestamps();

            $table->foreign('drill_id')->references('id')->on('emergency_drills')->onDelete('cascade');
            $table->foreign('student_id')->references('student_id')->on('students');
            $table->foreign('rescuer_id')->references('user_id')->on('users')->nullable();
            
            $table->unique(['drill_id', 'student_id']);
            $table->index(['drill_id', 'role', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('drill_participants');
    }
};
