<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('qr_codes', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('student_id');
            $table->string('qr_token', 100)->unique();
            $table->timestamp('qr_generated_at')->nullable();
            $table->timestamp('qr_expires_at')->nullable();
            $table->timestamps();

            $table->foreign('student_id')->references('student_id')->on('students')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('qr_codes');
    }
};
