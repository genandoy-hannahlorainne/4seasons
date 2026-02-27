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
        Schema::create('vitals', function (Blueprint $table) {
            $table->bigInteger('vitals_id', false, true)->primary();
            $table->bigInteger('visit_id', false, true);
            $table->decimal('temperature', 4, 1)->nullable()->comment('Temperature in Celsius');
            $table->string('blood_pressure', 20)->nullable()->comment('Systolic/Diastolic');
            $table->integer('pulse_rate')->nullable()->comment('Beats per minute');
            $table->integer('respiratory_rate')->nullable()->comment('Breaths per minute');
            $table->decimal('oxygen_saturation', 5, 2)->nullable()->comment('SpO2 percentage');
            $table->decimal('height_cm', 5, 2)->nullable()->comment('Height in centimeters');
            $table->decimal('weight_kg', 5, 2)->nullable()->comment('Weight in kilograms');
            $table->decimal('bmi', 4, 2)->nullable()->comment('Body Mass Index');
            $table->text('notes')->nullable();
            $table->timestamp('recorded_at')->useCurrent();
            
            $table->foreign('visit_id')->references('visit_id')->on('medical_visits');
            $table->index(['visit_id']);
            $table->index(['recorded_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vitals');
    }
};
