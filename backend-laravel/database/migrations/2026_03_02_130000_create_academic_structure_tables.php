<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('grade_levels')) {
            Schema::create('grade_levels', function (Blueprint $table) {
                $table->id();
                $table->integer('level_number')->comment('7, 8, 9, 10, 11, 12');
                $table->string('level_name', 50)->comment('Grade 7, Grade 8, etc.');
                $table->text('description')->nullable();
                $table->timestamp('created_at')->useCurrent();
                $table->boolean('is_active')->default(true);

                $table->unique('level_number');
            });
        }

        if (Schema::hasTable('grade_levels') && DB::table('grade_levels')->count() === 0) {
            DB::table('grade_levels')->insert([
                [
                    'id' => 1,
                    'level_number' => 7,
                    'level_name' => 'Grade 7',
                    'description' => 'First Year - Junior High School',
                    'is_active' => true,
                ],
                [
                    'id' => 2,
                    'level_number' => 8,
                    'level_name' => 'Grade 8',
                    'description' => 'Second Year - Junior High School',
                    'is_active' => true,
                ],
                [
                    'id' => 3,
                    'level_number' => 9,
                    'level_name' => 'Grade 9',
                    'description' => 'Third Year - Junior High School',
                    'is_active' => true,
                ],
                [
                    'id' => 4,
                    'level_number' => 10,
                    'level_name' => 'Grade 10',
                    'description' => 'Fourth Year - Junior High School',
                    'is_active' => true,
                ],
                [
                    'id' => 5,
                    'level_number' => 11,
                    'level_name' => 'Grade 11',
                    'description' => 'First Year - Senior High School',
                    'is_active' => true,
                ],
                [
                    'id' => 6,
                    'level_number' => 12,
                    'level_name' => 'Grade 12',
                    'description' => 'Second Year - Senior High School',
                    'is_active' => true,
                ],
            ]);
        }

        if (!Schema::hasTable('school_years')) {
            Schema::create('school_years', function (Blueprint $table) {
                $table->id();
                $table->string('year_name', 20);
                $table->date('start_date');
                $table->date('end_date');
                $table->boolean('is_active')->default(false);
                $table->boolean('is_current')->default(false);
                $table->timestamp('created_at')->useCurrent();
                $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
                $table->unsignedInteger('created_by')->nullable();

                $table->unique('year_name');
                $table->index('is_current');
                $table->index('is_active');
            });
        }

        if (!Schema::hasTable('sections')) {
            Schema::create('sections', function (Blueprint $table) {
                $table->id();
                $table->string('section_name', 50);
                $table->unsignedBigInteger('grade_level_id');
                $table->unsignedBigInteger('school_year_id');
                $table->unsignedInteger('adviser_id')->nullable();
                $table->integer('capacity')->default(50);
                $table->integer('current_enrollment')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamp('created_at')->useCurrent();
                $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
                $table->unsignedInteger('created_by')->nullable();

                $table->unique(['section_name', 'grade_level_id', 'school_year_id'], 'unique_section_per_year');
                $table->index('grade_level_id');
                $table->index('school_year_id');
                $table->index('adviser_id');

                $table->foreign('grade_level_id')->references('id')->on('grade_levels');
                $table->foreign('school_year_id')->references('id')->on('school_years');
                $table->foreign('adviser_id')->references('user_id')->on('users')->nullOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('sections')) {
            Schema::drop('sections');
        }

        if (Schema::hasTable('school_years')) {
            Schema::drop('school_years');
        }

        if (Schema::hasTable('grade_levels')) {
            Schema::drop('grade_levels');
        }
    }
};
