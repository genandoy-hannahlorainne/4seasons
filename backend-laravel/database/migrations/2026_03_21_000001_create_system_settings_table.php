<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('section', 50);   // system, email, notifications, security, backup
            $table->string('key', 100);
            $table->text('value')->nullable();
            $table->string('type', 20)->default('string'); // string, boolean, integer, json
            $table->timestamps();

            $table->unique(['section', 'key']);
            $table->index('section');
        });

        // Seed defaults
        $now = now();
        $defaults = [
            // system
            ['section' => 'system', 'key' => 'app_name',    'value' => 'PDMHS Medical Record System', 'type' => 'string'],
            ['section' => 'system', 'key' => 'app_version', 'value' => '1.0.0',                        'type' => 'string'],
            ['section' => 'system', 'key' => 'timezone',    'value' => 'Asia/Manila',                  'type' => 'string'],
            ['section' => 'system', 'key' => 'date_format', 'value' => 'Y-m-d',                        'type' => 'string'],
            ['section' => 'system', 'key' => 'time_format', 'value' => 'H:i:s',                        'type' => 'string'],
            // email
            ['section' => 'email', 'key' => 'smtp_host',       'value' => 'mailhog',                    'type' => 'string'],
            ['section' => 'email', 'key' => 'smtp_port',       'value' => '1025',                       'type' => 'integer'],
            ['section' => 'email', 'key' => 'smtp_username',   'value' => '',                           'type' => 'string'],
            ['section' => 'email', 'key' => 'smtp_from_name',  'value' => 'PDMHS Medical System',       'type' => 'string'],
            ['section' => 'email', 'key' => 'smtp_enabled',    'value' => '1',                          'type' => 'boolean'],
            // notifications
            ['section' => 'notifications', 'key' => 'email_on_registration',    'value' => '1',  'type' => 'boolean'],
            ['section' => 'notifications', 'key' => 'email_on_password_reset',  'value' => '1',  'type' => 'boolean'],
            ['section' => 'notifications', 'key' => 'email_on_medical_visit',   'value' => '0',  'type' => 'boolean'],
            ['section' => 'notifications', 'key' => 'sms_enabled',              'value' => '0',  'type' => 'boolean'],
            ['section' => 'notifications', 'key' => 'notification_retention_days', 'value' => '30', 'type' => 'integer'],
            // security
            ['section' => 'security', 'key' => 'password_min_length',         'value' => '6',   'type' => 'integer'],
            ['section' => 'security', 'key' => 'password_require_uppercase',  'value' => '0',   'type' => 'boolean'],
            ['section' => 'security', 'key' => 'password_require_numbers',    'value' => '0',   'type' => 'boolean'],
            ['section' => 'security', 'key' => 'session_timeout_minutes',     'value' => '1440','type' => 'integer'],
            ['section' => 'security', 'key' => 'max_login_attempts',          'value' => '5',   'type' => 'integer'],
            ['section' => 'security', 'key' => 'lockout_duration_minutes',    'value' => '15',  'type' => 'integer'],
            // backup
            ['section' => 'backup', 'key' => 'auto_backup_enabled',    'value' => '0',      'type' => 'boolean'],
            ['section' => 'backup', 'key' => 'backup_frequency',       'value' => 'daily',  'type' => 'string'],
            ['section' => 'backup', 'key' => 'backup_time',            'value' => '02:00',  'type' => 'string'],
            ['section' => 'backup', 'key' => 'backup_retention_days',  'value' => '30',     'type' => 'integer'],
        ];

        foreach ($defaults as $row) {
            $row['created_at'] = $now;
            $row['updated_at'] = $now;
            DB::table('system_settings')->insertOrIgnore($row);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};
