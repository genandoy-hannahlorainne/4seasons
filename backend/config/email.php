<?php
/**
 * Email Configuration
 * Configure email settings for the medical system
 */

class EmailConfig {
    // SMTP Configuration - UPDATE THESE WITH YOUR MAILTRAP OR GMAIL CREDENTIALS
    // For Mailtrap (FREE): Get credentials from https://mailtrap.io
    // For Gmail: Use your email and app password from https://myaccount.google.com/apppasswords
    
    // PRODUCTION: Gmail SMTP (comment out when using Mailtrap)
    // const SMTP_HOST = 'smtp.gmail.com';
    // const SMTP_PORT = 587;
    // const SMTP_USERNAME = '4seasons.iska@gmail.com'; // Your Gmail address
    // const SMTP_PASSWORD = 'YOUR_APP_PASSWORD_HERE'; // Your Gmail app password (16 characters)
    // const SMTP_ENCRYPTION = 'tls';
    
    // TESTING: Mailtrap (ACTIVE - working configuration)
    const SMTP_HOST = 'sandbox.smtp.mailtrap.io';
    const SMTP_PORT = 2525;
    const SMTP_USERNAME = 'da41244fa1af3f';
    const SMTP_PASSWORD = '0250a28bcffa58';
    const SMTP_ENCRYPTION = 'tls';
    
    // Email Settings
    const FROM_EMAIL = '4seasons.iska@gmail.com';
    const FROM_NAME = 'Studentcare+ PDMHS Medical Record System';
    const REPLY_TO = '4seasons.iska@gmail.com';
    
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