<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private array $foreignKeys = [
        'advisers'           => 'advisers_user_id_foreign',
        'clinic_staff'       => 'clinic_staff_user_id_foreign',
        'students'           => 'students_user_id_foreign',
        'emergency_drills'   => 'emergency_drills_created_by_foreign',
        'drill_scans'        => 'drill_scans_scanned_by_foreign',
        'sections'           => 'sections_adviser_id_foreign',
    ];

    // drill_participants has two FKs on user_id
    private array $drillParticipantFKs = [
        'drill_participants_user_id_foreign',
        'drill_participants_rescuer_id_foreign',
    ];

    private function dropForeignKeyIfExists(string $table, string $fk): void
    {
        $exists = DB::select("
            SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = ?
              AND CONSTRAINT_NAME = ?
              AND CONSTRAINT_TYPE = 'FOREIGN KEY'
        ", [$table, $fk]);

        if (!empty($exists)) {
            DB::statement("ALTER TABLE `{$table}` DROP FOREIGN KEY `{$fk}`");
        }
    }

    public function up(): void
    {
        // Skip MySQL-specific ALTER TABLE operations when not using MySQL (e.g., sqlite for tests)
        if (Schema::getConnection()->getDriverName() !== 'mysql') {
            return;
        }

        // Drop all foreign keys referencing users.user_id
        foreach ($this->foreignKeys as $table => $fk) {
            $this->dropForeignKeyIfExists($table, $fk);
        }
        foreach ($this->drillParticipantFKs as $fk) {
            $this->dropForeignKeyIfExists('drill_participants', $fk);
        }

        // Add AUTO_INCREMENT
        DB::statement('ALTER TABLE `users` MODIFY `user_id` INT UNSIGNED NOT NULL AUTO_INCREMENT');

        // Restore foreign keys
        foreach ($this->foreignKeys as $table => $fk) {
            $col = match($table) {
                'emergency_drills' => 'created_by',
                'drill_scans'      => 'scanned_by',
                'sections'         => 'adviser_id',
                default            => 'user_id',
            };
            DB::statement("ALTER TABLE `{$table}` ADD CONSTRAINT `{$fk}` FOREIGN KEY (`{$col}`) REFERENCES `users` (`user_id`)");
        }
        DB::statement("ALTER TABLE `drill_participants` ADD CONSTRAINT `drill_participants_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)");
        DB::statement("ALTER TABLE `drill_participants` ADD CONSTRAINT `drill_participants_rescuer_id_foreign` FOREIGN KEY (`rescuer_id`) REFERENCES `users` (`user_id`)");
    }

    public function down(): void
    {
        // Skip MySQL-specific ALTER TABLE operations when not using MySQL
        if (Schema::getConnection()->getDriverName() !== 'mysql') {
            return;
        }

        // Drop all foreign keys
        foreach ($this->foreignKeys as $table => $fk) {
            $this->dropForeignKeyIfExists($table, $fk);
        }
        foreach ($this->drillParticipantFKs as $fk) {
            $this->dropForeignKeyIfExists('drill_participants', $fk);
        }

        // Remove AUTO_INCREMENT
        DB::statement('ALTER TABLE `users` MODIFY `user_id` INT UNSIGNED NOT NULL');

        // Restore foreign keys
        foreach ($this->foreignKeys as $table => $fk) {
            $col = match($table) {
                'emergency_drills' => 'created_by',
                'drill_scans'      => 'scanned_by',
                'sections'         => 'adviser_id',
                default            => 'user_id',
            };
            DB::statement("ALTER TABLE `{$table}` ADD CONSTRAINT `{$fk}` FOREIGN KEY (`{$col}`) REFERENCES `users` (`user_id`)");
        }
        DB::statement("ALTER TABLE `drill_participants` ADD CONSTRAINT `drill_participants_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)");
        DB::statement("ALTER TABLE `drill_participants` ADD CONSTRAINT `drill_participants_rescuer_id_foreign` FOREIGN KEY (`rescuer_id`) REFERENCES `users` (`user_id`)");
    }
};
