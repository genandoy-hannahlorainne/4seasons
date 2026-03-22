<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private array $foreignKeys = [
        'advisers'           => 'advisers_user_id_foreign',
        'clinic_staff'       => 'clinic_staff_user_id_foreign',
        'students'           => 'students_user_id_foreign',
        'emergency_drills'   => 'emergency_drills_created_by_foreign',
        'drill_scans'        => 'drill_scans_scanned_by_foreign',
    ];

    // drill_participants has two FKs on user_id
    private array $drillParticipantFKs = [
        'drill_participants_user_id_foreign',
        'drill_participants_rescuer_id_foreign',
    ];

    public function up(): void
    {
        // Drop all foreign keys referencing users.user_id
        foreach ($this->foreignKeys as $table => $fk) {
            DB::statement("ALTER TABLE `{$table}` DROP FOREIGN KEY `{$fk}`");
        }
        foreach ($this->drillParticipantFKs as $fk) {
            DB::statement("ALTER TABLE `drill_participants` DROP FOREIGN KEY `{$fk}`");
        }

        // Add AUTO_INCREMENT
        DB::statement('ALTER TABLE `users` MODIFY `user_id` INT UNSIGNED NOT NULL AUTO_INCREMENT');

        // Restore foreign keys
        foreach ($this->foreignKeys as $table => $fk) {
            $col = ($table === 'emergency_drills') ? 'created_by' : (($table === 'drill_scans') ? 'scanned_by' : 'user_id');
            DB::statement("ALTER TABLE `{$table}` ADD CONSTRAINT `{$fk}` FOREIGN KEY (`{$col}`) REFERENCES `users` (`user_id`)");
        }
        DB::statement("ALTER TABLE `drill_participants` ADD CONSTRAINT `drill_participants_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)");
        DB::statement("ALTER TABLE `drill_participants` ADD CONSTRAINT `drill_participants_rescuer_id_foreign` FOREIGN KEY (`rescuer_id`) REFERENCES `users` (`user_id`)");
    }

    public function down(): void
    {
        // Drop all foreign keys
        foreach ($this->foreignKeys as $table => $fk) {
            DB::statement("ALTER TABLE `{$table}` DROP FOREIGN KEY `{$fk}`");
        }
        foreach ($this->drillParticipantFKs as $fk) {
            DB::statement("ALTER TABLE `drill_participants` DROP FOREIGN KEY `{$fk}`");
        }

        // Remove AUTO_INCREMENT
        DB::statement('ALTER TABLE `users` MODIFY `user_id` INT UNSIGNED NOT NULL');

        // Restore foreign keys
        foreach ($this->foreignKeys as $table => $fk) {
            $col = ($table === 'emergency_drills') ? 'created_by' : (($table === 'drill_scans') ? 'scanned_by' : 'user_id');
            DB::statement("ALTER TABLE `{$table}` ADD CONSTRAINT `{$fk}` FOREIGN KEY (`{$col}`) REFERENCES `users` (`user_id`)");
        }
        DB::statement("ALTER TABLE `drill_participants` ADD CONSTRAINT `drill_participants_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)");
        DB::statement("ALTER TABLE `drill_participants` ADD CONSTRAINT `drill_participants_rescuer_id_foreign` FOREIGN KEY (`rescuer_id`) REFERENCES `users` (`user_id`)");
    }
};
