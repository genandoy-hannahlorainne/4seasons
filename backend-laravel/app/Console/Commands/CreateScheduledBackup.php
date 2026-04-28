<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\SystemSetting;

class CreateScheduledBackup extends Command
{
    protected $signature = 'backup:create-scheduled';
    protected $description = 'Create automatic database backup based on system settings';

    public function handle()
    {
        try {
            // Check if auto backup is enabled
            $autoBackupEnabled = SystemSetting::get('backup', 'auto_backup_enabled', false);
            
            if (!$autoBackupEnabled) {
                return 0; // Silent exit when disabled
            }

            // Check if it's time to run backup based on settings
            if (!$this->shouldRunBackup()) {
                return 0; // Not time yet
            }

            $this->info('Creating scheduled backup...');

            $backupDir = storage_path('app/backups');
            if (!file_exists($backupDir)) {
                mkdir($backupDir, 0755, true);
            }

            $filename = 'scheduled_backup_' . now()->format('Y-m-d_H-i-s') . '.sql';
            $path = $backupDir . '/' . $filename;

            $db = config('database.connections.mysql.database');
            
            $sql = "-- Scheduled Backup created at " . now()->toISOString() . "\n";
            $sql .= "-- Database: {$db}\n\n";
            $sql .= "SET FOREIGN_KEY_CHECKS=0;\n\n";

            // Get all tables
            $tables = DB::select('SHOW TABLES');
            $tableKey = 'Tables_in_' . $db;

            foreach ($tables as $table) {
                $tableName = $table->$tableKey;
                
                // Get CREATE TABLE statement
                $createTable = DB::select("SHOW CREATE TABLE `{$tableName}`")[0];
                $sql .= "-- Table: {$tableName}\n";
                $sql .= "DROP TABLE IF EXISTS `{$tableName}`;\n";
                $sql .= $createTable->{'Create Table'} . ";\n\n";

                // Get table data
                $rows = DB::table($tableName)->get();
                if ($rows->count() > 0) {
                    $sql .= "-- Data for table {$tableName}\n";
                    $sql .= "INSERT INTO `{$tableName}` VALUES\n";
                    
                    $values = [];
                    foreach ($rows as $row) {
                        $rowData = [];
                        foreach ((array)$row as $value) {
                            if (is_null($value)) {
                                $rowData[] = 'NULL';
                            } else {
                                $rowData[] = "'" . addslashes($value) . "'";
                            }
                        }
                        $values[] = '(' . implode(',', $rowData) . ')';
                    }
                    
                    $sql .= implode(",\n", $values) . ";\n\n";
                }
            }

            $sql .= "SET FOREIGN_KEY_CHECKS=1;\n";

            file_put_contents($path, $sql);

            $this->info("Backup created successfully: {$filename}");
            $this->info("Size: " . $this->formatBytes(filesize($path)));

            // Clean up old backups based on retention setting
            $this->cleanupOldBackups();

            return 0;

        } catch (\Exception $e) {
            $this->error('Failed to create backup: ' . $e->getMessage());
            return 1;
        }
    }

    private function shouldRunBackup()
    {
        $frequency = SystemSetting::get('backup', 'backup_frequency', 'daily');
        $backupTime = SystemSetting::get('backup', 'backup_time', '02:00');
        
        // Parse backup time (HH:MM format)
        [$hour, $minute] = explode(':', $backupTime);
        
        $currentTime = now();
        
        switch ($frequency) {
            case 'hourly':
                // Run every hour at the specified minute
                return $currentTime->minute == (int)$minute;
                
            case 'daily':
                // Run daily at the specified time
                return $currentTime->hour == (int)$hour && $currentTime->minute == (int)$minute;
                
            case 'weekly':
                // Run weekly on Sunday at the specified time
                return $currentTime->dayOfWeek == 0 && 
                       $currentTime->hour == (int)$hour && 
                       $currentTime->minute == (int)$minute;
                
            case 'monthly':
                // Run monthly on the 1st at the specified time
                return $currentTime->day == 1 && 
                       $currentTime->hour == (int)$hour && 
                       $currentTime->minute == (int)$minute;
                       
            default:
                return false;
        }
    }

    private function cleanupOldBackups()
    {
        try {
            $retentionDays = SystemSetting::get('backup', 'backup_retention_days', 30);
            $backupDir = storage_path('app/backups');
            
            if (!file_exists($backupDir)) {
                return;
            }

            $files = glob($backupDir . '/*.sql') ?: [];
            $cutoffTime = now()->subDays($retentionDays)->timestamp;
            $deletedCount = 0;

            foreach ($files as $file) {
                if (filemtime($file) < $cutoffTime) {
                    unlink($file);
                    $deletedCount++;
                    $this->info("Deleted old backup: " . basename($file));
                }
            }

            if ($deletedCount > 0) {
                $this->info("Cleaned up {$deletedCount} old backup(s)");
            }

        } catch (\Exception $e) {
            $this->warn('Failed to cleanup old backups: ' . $e->getMessage());
        }
    }

    private function formatBytes($size, $precision = 2)
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        
        for ($i = 0; $size > 1024 && $i < count($units) - 1; $i++) {
            $size /= 1024;
        }
        
        return round($size, $precision) . ' ' . $units[$i];
    }
}