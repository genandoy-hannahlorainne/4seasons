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
        Schema::table('drill_participants', function (Blueprint $table) {
            // Drop the old foreign key constraint
            $table->dropForeign(['student_id']);
            $table->dropUnique(['drill_id', 'student_id']);
            
            // Rename student_id to user_id and change the constraint
            $table->renameColumn('student_id', 'user_id');
        });
        
        // Add new foreign key constraint and unique index
        Schema::table('drill_participants', function (Blueprint $table) {
            $table->foreign('user_id')->references('user_id')->on('users');
            $table->unique(['drill_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('drill_participants', function (Blueprint $table) {
            // Drop the new foreign key constraint
            $table->dropForeign(['user_id']);
            $table->dropUnique(['drill_id', 'user_id']);
            
            // Rename back to student_id
            $table->renameColumn('user_id', 'student_id');
        });
        
        // Restore old foreign key constraint
        Schema::table('drill_participants', function (Blueprint $table) {
            $table->foreign('student_id')->references('student_id')->on('students');
            $table->unique(['drill_id', 'student_id']);
        });
    }
};