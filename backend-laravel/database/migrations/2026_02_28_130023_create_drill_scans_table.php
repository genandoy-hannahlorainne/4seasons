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
        Schema::create('drill_scans', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('drill_id');
            $table->unsignedBigInteger('participant_id');
            $table->unsignedInteger('scanned_by'); // Changed to match users.user_id
            $table->string('scan_type')->default('qr'); // qr, manual, nfc
            $table->timestamp('scanned_at');
            $table->integer('seconds_from_start'); // Time from drill start
            $table->string('location')->nullable(); // GPS coordinates as string if available
            $table->text('notes')->nullable();
            $table->json('metadata')->nullable(); // Additional scan data
            $table->timestamps();

            $table->foreign('drill_id')->references('id')->on('emergency_drills')->onDelete('cascade');
            $table->foreign('participant_id')->references('id')->on('drill_participants')->onDelete('cascade');
            $table->foreign('scanned_by')->references('user_id')->on('users');
            
            $table->index(['drill_id', 'scanned_at']);
            $table->index(['participant_id', 'scanned_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('drill_scans');
    }
};
