<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Skip MySQL-specific ALTER TABLE operations when not using MySQL
        if (Schema::getConnection()->getDriverName() !== 'mysql') {
            return;
        }

        // Fix students.student_id — drop FKs first
        DB::statement('ALTER TABLE `allergies` DROP FOREIGN KEY `allergies_student_id_foreign`');
        DB::statement('ALTER TABLE `medical_history` DROP FOREIGN KEY `medical_history_student_id_foreign`');
        DB::statement('ALTER TABLE `medical_visits` DROP FOREIGN KEY `medical_visits_student_id_foreign`');

        DB::statement('ALTER TABLE `students` MODIFY `student_id` INT UNSIGNED NOT NULL AUTO_INCREMENT');

        DB::statement('ALTER TABLE `allergies` ADD CONSTRAINT `allergies_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`)');
        DB::statement('ALTER TABLE `medical_history` ADD CONSTRAINT `medical_history_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`)');
        DB::statement('ALTER TABLE `medical_visits` ADD CONSTRAINT `medical_visits_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`)');

        // Fix advisers.adviser_id — no FKs referencing it
        DB::statement('ALTER TABLE `advisers` MODIFY `adviser_id` INT UNSIGNED NOT NULL AUTO_INCREMENT');

        // Fix clinic_staff.clinic_staff_id — no FKs referencing it
        DB::statement('ALTER TABLE `clinic_staff` MODIFY `clinic_staff_id` INT UNSIGNED NOT NULL AUTO_INCREMENT');
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'mysql') {
            return;
        }

        DB::statement('ALTER TABLE `allergies` DROP FOREIGN KEY `allergies_student_id_foreign`');
        DB::statement('ALTER TABLE `medical_history` DROP FOREIGN KEY `medical_history_student_id_foreign`');
        DB::statement('ALTER TABLE `medical_visits` DROP FOREIGN KEY `medical_visits_student_id_foreign`');

        DB::statement('ALTER TABLE `students` MODIFY `student_id` INT UNSIGNED NOT NULL');

        DB::statement('ALTER TABLE `allergies` ADD CONSTRAINT `allergies_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`)');
        DB::statement('ALTER TABLE `medical_history` ADD CONSTRAINT `medical_history_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`)');
        DB::statement('ALTER TABLE `medical_visits` ADD CONSTRAINT `medical_visits_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`)');

        DB::statement('ALTER TABLE `advisers` MODIFY `adviser_id` INT UNSIGNED NOT NULL');
        DB::statement('ALTER TABLE `clinic_staff` MODIFY `clinic_staff_id` INT UNSIGNED NOT NULL');
    }
};
