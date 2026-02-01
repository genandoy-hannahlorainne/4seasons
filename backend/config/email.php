<?php
/**
 * Email Configuration
 * Configure email settings for the medical system
 */

class EmailConfig {
    // SMTP Configuration
    const SMTP_HOST = 'smtp.gmail.com'; // Change to your SMTP server
    const SMTP_PORT = 587;
    const SMTP_USERNAME = 'your-email@gmail.com'; // Change to your email
    const SMTP_PASSWORD = 'your-app-password'; // Use app password for Gmail
    const SMTP_ENCRYPTION = 'tls';
    
    // Email Settings
    const FROM_EMAIL = 'noreply@fourseasons-clinic.edu.ph';
    const FROM_NAME = 'Four Seasons School Clinic';
    const REPLY_TO = 'clinic@fourseasons.edu.ph';
    
    // Email Templates Directory
    const TEMPLATES_DIR = __DIR__ . '/../email-templates/';
    
    // Email Types
    const TYPE_EMERGENCY = 'emergency';
    const TYPE_ROUTINE = 'routine';
    const TYPE_REPORT = 'report';
    const TYPE_SYSTEM = 'system';
    
    // Priority Levels
    const PRIORITY_HIGH = 'high';
    const PRIORITY_NORMAL = 'normal';
    const PRIORITY_LOW = 'low';
    
    public static function getConfig() {
        return [
            'host' => self::SMTP_HOST,
            'port' => self::SMTP_PORT,
            'username' => self::SMTP_USERNAME,
            'password' => self::SMTP_PASSWORD,
            'encryption' => self::SMTP_ENCRYPTION,
            'from_email' => self::FROM_EMAIL,
            'from_name' => self::FROM_NAME,
            'reply_to' => self::REPLY_TO
        ];
    }
}
?>