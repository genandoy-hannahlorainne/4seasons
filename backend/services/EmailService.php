<?php
/**
 * Email Service Class
 * Handles all email sending functionality for the medical system
 */

require_once __DIR__ . '/../config/email.php';

class EmailService {
    private $config;
    private $db;
    
    public function __construct($database) {
        $this->config = EmailConfig::getConfig();
        $this->db = $database->getConnection();
    }
    
    /**
     * Send emergency notification email to admin
     */
    public function sendEmergencyNotification($recipientEmail, $recipientName, $studentData, $visitData) {
        $subject = "🚨 EMERGENCY ALERT - Medical Attention Required";
        
        $template = $this->loadTemplate('emergency-notification', [
            'recipient_name' => $recipientName,
            'student_name' => $studentData['full_name'],
            'student_number' => $studentData['student_number'],
            'grade_section' => $studentData['grade_level'] . '-' . $studentData['section'],
            'chief_complaint' => $visitData['chief_complaint'],
            'visit_datetime' => $visitData['visit_datetime'],
            'clinic_staff' => $visitData['staff_name'],
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        
        return $this->sendEmail($recipientEmail, $recipientName, $subject, $template, EmailConfig::PRIORITY_HIGH);
    }
    
    /**
     * Send routine notification email to adviser
     */
    public function sendRoutineNotification($recipientEmail, $recipientName, $studentData, $visitData) {
        $subject = "Student Medical Visit Notification - " . $studentData['full_name'];
        
        $template = $this->loadTemplate('routine-notification', [
            'recipient_name' => $recipientName,
            'student_name' => $studentData['full_name'],
            'student_number' => $studentData['student_number'],
            'grade_section' => $studentData['grade_level'] . '-' . $studentData['section'],
            'chief_complaint' => $visitData['chief_complaint'],
            'visit_datetime' => $visitData['visit_datetime'],
            'clinic_staff' => $visitData['staff_name'],
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        
        return $this->sendEmail($recipientEmail, $recipientName, $subject, $template, EmailConfig::PRIORITY_NORMAL);
    }
    
    /**
     * Send parent notification email
     */
    public function sendParentNotification($recipientEmail, $recipientName, $studentData, $visitData, $isEmergency = false) {
        $subject = $isEmergency ? 
            "🚨 URGENT: Your child visited the school clinic" : 
            "School Clinic Visit Notification - " . $studentData['full_name'];
        
        $template = $this->loadTemplate('parent-notification', [
            'parent_name' => $recipientName,
            'student_name' => $studentData['full_name'],
            'student_number' => $studentData['student_number'],
            'grade_section' => $studentData['grade_level'] . '-' . $studentData['section'],
            'chief_complaint' => $visitData['chief_complaint'],
            'visit_datetime' => $visitData['visit_datetime'],
            'clinic_staff' => $visitData['staff_name'],
            'is_emergency' => $isEmergency,
            'contact_phone' => '(02) 8123-4567', // School clinic phone
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        
        $priority = $isEmergency ? EmailConfig::PRIORITY_HIGH : EmailConfig::PRIORITY_NORMAL;
        return $this->sendEmail($recipientEmail, $recipientName, $subject, $template, $priority);
    }
    
    /**
     * Load email template
     */
    private function loadTemplate($templateName, $variables = []) {
        $templatePath = EmailConfig::TEMPLATES_DIR . $templateName . '.html';
        
        if (!file_exists($templatePath)) {
            // Fallback to basic template
            return $this->generateBasicTemplate($templateName, $variables);
        }
        
        $template = file_get_contents($templatePath);
        
        // Replace variables in template
        foreach ($variables as $key => $value) {
            $template = str_replace('{{' . $key . '}}', $value, $template);
        }
        
        return $template;
    }
    
    /**
     * Generate basic email template when file doesn't exist
     */
    private function generateBasicTemplate($templateName, $variables) {
        switch ($templateName) {
            case 'emergency-notification':
                return $this->generateEmergencyTemplate($variables);
            case 'routine-notification':
                return $this->generateRoutineTemplate($variables);
            case 'parent-notification':
                return $this->generateParentTemplate($variables);
            case 'account-creation':
                return $this->generateAccountCreationTemplate($variables);
            default:
                return $this->generateGenericTemplate($variables);
        }
    }
    
    private function generateEmergencyTemplate($vars) {
        return "
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .emergency { background: #ff6b6b; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
                .content { background: #f9f9f9; padding: 20px; border-radius: 8px; }
                .student-info { background: white; padding: 15px; border-radius: 5px; margin: 10px 0; }
                .footer { margin-top: 20px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class='emergency'>
                <h2>🚨 EMERGENCY MEDICAL ALERT</h2>
                <p>Immediate attention required for student medical emergency.</p>
            </div>
            
            <div class='content'>
                <p>Dear {$vars['recipient_name']},</p>
                
                <p><strong>A student has been flagged for emergency medical attention.</strong></p>
                
                <div class='student-info'>
                    <h3>Student Information:</h3>
                    <p><strong>Name:</strong> {$vars['student_name']}</p>
                    <p><strong>Student Number:</strong> {$vars['student_number']}</p>
                    <p><strong>Grade & Section:</strong> {$vars['grade_section']}</p>
                    <p><strong>Chief Complaint:</strong> {$vars['chief_complaint']}</p>
                    <p><strong>Visit Time:</strong> {$vars['visit_datetime']}</p>
                    <p><strong>Attended by:</strong> {$vars['clinic_staff']}</p>
                </div>
                
                <p><strong>Action Required:</strong> Please review this case immediately and determine if additional medical intervention is needed.</p>
                
                <p>Best regards,<br>Four Seasons School Clinic System</p>
            </div>
            
            <div class='footer'>
                <p>This is an automated notification sent at {$vars['timestamp']}</p>
            </div>
        </body>
        </html>";
    }
    
    private function generateRoutineTemplate($vars) {
        return "
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .header { background: #2c3e50; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
                .content { background: #f9f9f9; padding: 20px; border-radius: 8px; }
                .student-info { background: white; padding: 15px; border-radius: 5px; margin: 10px 0; }
                .footer { margin-top: 20px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class='header'>
                <h2>📋 Student Medical Visit Notification</h2>
            </div>
            
            <div class='content'>
                <p>Dear {$vars['recipient_name']},</p>
                
                <p>One of your students visited the school clinic for routine medical care.</p>
                
                <div class='student-info'>
                    <h3>Visit Details:</h3>
                    <p><strong>Student:</strong> {$vars['student_name']}</p>
                    <p><strong>Student Number:</strong> {$vars['student_number']}</p>
                    <p><strong>Grade & Section:</strong> {$vars['grade_section']}</p>
                    <p><strong>Reason for Visit:</strong> {$vars['chief_complaint']}</p>
                    <p><strong>Visit Time:</strong> {$vars['visit_datetime']}</p>
                    <p><strong>Attended by:</strong> {$vars['clinic_staff']}</p>
                </div>
                
                <p>This is for your information and records. No immediate action is required unless you have concerns about the student.</p>
                
                <p>Best regards,<br>Four Seasons School Clinic</p>
            </div>
            
            <div class='footer'>
                <p>This notification was sent at {$vars['timestamp']}</p>
            </div>
        </body>
        </html>";
    }
    
    private function generateParentTemplate($vars) {
        $urgentClass = $vars['is_emergency'] ? 'emergency' : 'routine';
        $urgentText = $vars['is_emergency'] ? '🚨 URGENT MEDICAL ATTENTION' : '📋 Clinic Visit Notification';
        
        return "
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .emergency { background: #ff6b6b; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
                .routine { background: #2c3e50; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
                .content { background: #f9f9f9; padding: 20px; border-radius: 8px; }
                .student-info { background: white; padding: 15px; border-radius: 5px; margin: 10px 0; }
                .contact-info { background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 10px 0; }
                .footer { margin-top: 20px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class='{$urgentClass}'>
                <h2>{$urgentText}</h2>
            </div>
            
            <div class='content'>
                <p>Dear {$vars['parent_name']},</p>
                
                <p>Your child visited the Four Seasons School Clinic today.</p>
                
                <div class='student-info'>
                    <h3>Visit Information:</h3>
                    <p><strong>Student:</strong> {$vars['student_name']}</p>
                    <p><strong>Student Number:</strong> {$vars['student_number']}</p>
                    <p><strong>Grade & Section:</strong> {$vars['grade_section']}</p>
                    <p><strong>Reason for Visit:</strong> {$vars['chief_complaint']}</p>
                    <p><strong>Visit Time:</strong> {$vars['visit_datetime']}</p>
                    <p><strong>Attended by:</strong> {$vars['clinic_staff']}</p>
                </div>
                
                " . ($vars['is_emergency'] ? 
                    "<p><strong>⚠️ This was flagged as an emergency visit. Please contact the school clinic immediately for more details.</strong></p>" : 
                    "<p>This was a routine visit. Your child received appropriate care and attention.</p>") . "
                
                <div class='contact-info'>
                    <h3>Contact Information:</h3>
                    <p><strong>School Clinic:</strong> {$vars['contact_phone']}</p>
                    <p><strong>Email:</strong> clinic@fourseasons.edu.ph</p>
                </div>
                
                <p>If you have any questions or concerns, please don't hesitate to contact us.</p>
                
                <p>Best regards,<br>Four Seasons School Clinic</p>
            </div>
            
            <div class='footer'>
                <p>This notification was sent at {$vars['timestamp']}</p>
            </div>
        </body>
        </html>";
    }
    
    private function generateAccountCreationTemplate($vars) {
        return "
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .header { background: #2c3e50; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
                .content { background: #f9f9f9; padding: 20px; border-radius: 8px; }
                .credentials { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #ffc107; }
                .warning { background: #f8d7da; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #dc3545; }
                .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
                .footer { margin-top: 20px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class='header'>
                <h2>🎓 Welcome to PDMHS Medical System</h2>
            </div>
            
            <div class='content'>
                <p>Dear {$vars['recipient_name']},</p>
                
                <p>Your account has been created for the PDMHS Student Medical System as a <strong>{$vars['role']}</strong>.</p>
                
                <div class='credentials'>
                    <h3>📋 Your Login Credentials:</h3>
                    <p><strong>Username:</strong> {$vars['username']}</p>
                    <p><strong>Temporary Password:</strong> {$vars['temp_password']}</p>
                    <p><strong>Login URL:</strong> <a href='{$vars['login_url']}'>{$vars['login_url']}</a></p>
                </div>
                
                <div class='warning'>
                    <h3>⚠️ IMPORTANT SECURITY NOTICE:</h3>
                    <ul>
                        <li>You <strong>MUST</strong> change your password on first login</li>
                        <li>Do not share your credentials with anyone</li>
                        <li>Choose a strong password (min 8 characters, mix of letters, numbers, and symbols)</li>
                        <li>This temporary password will expire if not used within 7 days</li>
                    </ul>
                </div>
                
                <p style='text-align: center;'>
                    <a href='{$vars['login_url']}' class='button'>Login Now</a>
                </p>
                
                <p>If you did not expect this email or have any questions, please contact the school administrator immediately.</p>
                
                <p>Best regards,<br>PDMHS Administration</p>
            </div>
            
            <div class='footer'>
                <p>This account was created at {$vars['timestamp']}</p>
                <p>This is an automated email. Please do not reply to this message.</p>
            </div>
        </body>
        </html>";
    }
    
    private function generateGenericTemplate($vars) {
        return "<html><body><h2>Notification</h2><p>This is a system notification.</p></body></html>";
    }
    
    /**
     * Send email using PHP's mail function (basic implementation)
     * In production, use PHPMailer or similar library
     */
    private function sendEmail($to, $toName, $subject, $htmlBody, $priority = EmailConfig::PRIORITY_NORMAL) {
        try {
            // Basic headers
            $headers = [
                'MIME-Version: 1.0',
                'Content-type: text/html; charset=UTF-8',
                'From: ' . $this->config['from_name'] . ' <' . $this->config['from_email'] . '>',
                'Reply-To: ' . $this->config['reply_to'],
                'X-Priority: ' . ($priority === EmailConfig::PRIORITY_HIGH ? '1' : '3'),
                'X-Mailer: Four Seasons Clinic System'
            ];
            
            $headerString = implode("\r\n", $headers);
            
            // Log email attempt
            $this->logEmailAttempt($to, $subject, $priority);
            
            // Send email
            $result = mail($to, $subject, $htmlBody, $headerString);
            
            // Log result
            $this->logEmailResult($to, $subject, $result);
            
            return $result;
            
        } catch (Exception $e) {
            error_log("Email sending failed: " . $e->getMessage());
            $this->logEmailResult($to, $subject, false, $e->getMessage());
            return false;
        }
    }
    
    /**
     * Log email attempt
     */
    private function logEmailAttempt($to, $subject, $priority) {
        try {
            $query = "INSERT INTO email_logs (recipient, subject, priority, status, created_at) 
                     VALUES (:recipient, :subject, :priority, 'sending', NOW())";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':recipient', $to);
            $stmt->bindParam(':subject', $subject);
            $stmt->bindParam(':priority', $priority);
            $stmt->execute();
        } catch (Exception $e) {
            error_log("Failed to log email attempt: " . $e->getMessage());
        }
    }
    
    /**
     * Log email result
     */
    private function logEmailResult($to, $subject, $success, $error = null) {
        try {
            $status = $success ? 'sent' : 'failed';
            $query = "UPDATE email_logs SET status = :status, error_message = :error, sent_at = NOW() 
                     WHERE recipient = :recipient AND subject = :subject AND status = 'sending' 
                     ORDER BY created_at DESC LIMIT 1";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':status', $status);
            $stmt->bindParam(':error', $error);
            $stmt->bindParam(':recipient', $to);
            $stmt->bindParam(':subject', $subject);
            $stmt->execute();
        } catch (Exception $e) {
            error_log("Failed to log email result: " . $e->getMessage());
        }
    }
    
    /**
     * Send account creation email with credentials
     */
    public function sendAccountCreationEmail($recipientEmail, $recipientName, $username, $tempPassword, $role) {
        $subject = "Your PDMHS Medical System Account";
        
        $template = $this->loadTemplate('account-creation', [
            'recipient_name' => $recipientName,
            'username' => $username,
            'temp_password' => $tempPassword,
            'role' => ucfirst($role),
            'login_url' => 'http://localhost:4200/login', // Update with actual URL
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        
        return $this->sendEmail($recipientEmail, $recipientName, $subject, $template, EmailConfig::PRIORITY_NORMAL);
    }
    
    /**
     * Test email configuration
     */
    public function testEmailConfig() {
        $testEmail = $this->config['from_email'];
        $subject = "Email Configuration Test";
        $body = "<h2>Test Email</h2><p>If you receive this, email configuration is working correctly.</p>";
        
        return $this->sendEmail($testEmail, "Test User", $subject, $body);
    }
}
?>