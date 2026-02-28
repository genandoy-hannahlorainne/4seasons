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
        Schema::create('emergency_drills', function (Blueprint $table) {
            $table->id();
            $table->string('drill_name');
            $table->enum('drill_type', ['earthquake', 'fire', 'lockdown', 'medical', 'evacuation']);
            $table->text('description')->nullable();
            $table->enum('status', ['planned', 'active', 'completed', 'cancelled'])->default('planned');
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->integer('duration_seconds')->nullable();
            $table->unsignedInteger('created_by'); // Changed to match users.user_id
            $table->json('settings')->nullable(); // Drill-specific settings
            $table->json('statistics')->nullable(); // Performance metrics
            $table->timestamps();

            $table->foreign('created_by')->references('user_id')->on('users');
            $table->index(['status', 'drill_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('emergency_drills');
    }
};
