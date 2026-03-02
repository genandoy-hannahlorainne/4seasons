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
        if (Schema::hasTable('notifications')) {
            return;
        }

        Schema::create('notifications', function (Blueprint $table) {
            $table->bigIncrements('notification_id');
            $table->unsignedInteger('parent_id')->nullable();
            $table->unsignedInteger('user_id')->nullable();
            $table->unsignedInteger('student_id')->nullable();
            $table->unsignedBigInteger('visit_id')->nullable();
            $table->enum('channel', ['SMS', 'Email', 'System'])->default('SMS');
            $table->text('message')->nullable();
            $table->enum('status', ['Pending', 'Sent', 'Failed'])->default('Pending');
            $table->enum('priority', ['normal', 'urgent'])->default('normal');
            $table->string('provider_id', 100)->nullable();
            $table->dateTime('sent_at')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index('user_id');
            $table->index('student_id');
            $table->index('visit_id');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
