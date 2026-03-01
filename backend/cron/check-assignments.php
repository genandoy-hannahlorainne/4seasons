<?php
/**
 * Automated Student Assignment Checker
 * This script should be run via cron job to automatically maintain assignments
 * 
 * Recommended cron schedule:
 * # Check assignments every hour during school hours (7 AM - 6 PM, Mon-Fri)
 * 0 7-18 * * 1-5 /usr/bin/php /path/to/backend/cron/check-assignments.php
 * 
 * # Check assignments once daily during weekends
 * 0 9 * * 0,6 /usr/bin/php /path/to/backend/cron/check-assignments.php
 */

// Set up error reporting for cron
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../../logs/assignment-cron.log');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/StudentAssignmentService.php';

// Create log directory if it doesn't exist
$logDir = __DIR__ . '/../../logs';
if (!is_dir($logDir)) {
    mkdir($logDir, 0755, true);
}

$logFile = $logDir . '/assignment-cron.log';

function logMessage($message) {
    global $logFile;
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[$timestamp] $message" . PHP_EOL, FILE_APPEND | LOCK_EX);
}

try {
    logMessage("=== Assignment Check Started ===");
    
    $database = new Database();
    $assignmentService = new StudentAssignmentService($database);
    
    // 1. Validate current assignments
    logMessage("Validating current assignments...");
    $issues = $assignmentService->validateAllAssignments();
    
    if (empty($issues)) {
        logMessage("✅ All assignments are healthy - no action needed");
        logMessage("=== Assignment Check Completed ===");
        exit(0);
    }
    
    // 2. Log found issues
    logMessage("⚠️ Found " . count($issues) . " assignment issues:");
    foreach ($issues as $issue) {
        logMessage("  - {$issue['type']}: {$issue['count']} records (severity: {$issue['severity']})");
    }
    
    // 3. Check if auto-fix is enabled (can be controlled via environment variable)
    $autoFix = getenv('AUTO_FIX_ASSIGNMENTS') !== false ? 
               filter_var(getenv('AUTO_FIX_ASSIGNMENTS'), FILTER_VALIDATE_BOOLEAN) : 
               true; // Default to true
    
    if (!$autoFix) {
        logMessage("🔧 Auto-fix is disabled - manual intervention required");
        
        // Send notification to admin (if email service is configured)
        $adminEmail = getenv('ADMIN_EMAIL');
        if ($adminEmail) {
            $subject = "Student Assignment Issues Detected";
            $message = "Assignment issues found that require manual attention:\n\n";
            foreach ($issues as $issue) {
                $message .= "- {$issue['type']}: {$issue['count']} records\n";
            }
            $message .= "\nPlease check the admin panel for details.";
            
            // Use system mail or configured email service
            mail($adminEmail, $subject, $message);
            logMessage("📧 Notification sent to admin: $adminEmail");
        }
        
        logMessage("=== Assignment Check Completed (Manual Action Required) ===");
        exit(1);
    }
    
    // 4. Attempt to fix issues automatically
    logMessage("🔧 Auto-fixing assignment issues...");
    $fixResult = $assignmentService->fixAllAssignments();
    
    if ($fixResult['fixed_count'] > 0) {
        logMessage("✅ Successfully fixed {$fixResult['fixed_count']} assignments");
    }
    
    if (!empty($fixResult['errors'])) {
        logMessage("❌ Encountered " . count($fixResult['errors']) . " errors during fix:");
        foreach ($fixResult['errors'] as $error) {
            logMessage("  - $error");
        }
    }
    
    // 5. Re-validate to confirm fixes
    logMessage("Validating fixes...");
    $remainingIssues = $assignmentService->validateAllAssignments();
    
    if (empty($remainingIssues)) {
        logMessage("🎉 All assignment issues have been resolved!");
    } else {
        logMessage("⚠️ " . count($remainingIssues) . " issues remain after auto-fix");
        
        // Send notification about remaining issues
        $adminEmail = getenv('ADMIN_EMAIL');
        if ($adminEmail) {
            $subject = "Student Assignment Issues Partially Resolved";
            $message = "Auto-fix completed but some issues remain:\n\n";
            $message .= "Fixed: {$fixResult['fixed_count']} assignments\n";
            $message .= "Remaining issues: " . count($remainingIssues) . "\n\n";
            foreach ($remainingIssues as $issue) {
                $message .= "- {$issue['type']}: {$issue['count']} records\n";
            }
            $message .= "\nManual intervention may be required.";
            
            mail($adminEmail, $subject, $message);
            logMessage("📧 Notification sent to admin about remaining issues");
        }
    }
    
    logMessage("=== Assignment Check Completed ===");
    
} catch (Exception $e) {
    logMessage("❌ FATAL ERROR: " . $e->getMessage());
    logMessage("Stack trace: " . $e->getTraceAsString());
    
    // Send error notification
    $adminEmail = getenv('ADMIN_EMAIL');
    if ($adminEmail) {
        $subject = "Student Assignment Cron Job Failed";
        $message = "The automated assignment checker encountered a fatal error:\n\n";
        $message .= "Error: " . $e->getMessage() . "\n";
        $message .= "Time: " . date('Y-m-d H:i:s') . "\n";
        $message .= "\nPlease check the system logs for more details.";
        
        mail($adminEmail, $subject, $message);
    }
    
    logMessage("=== Assignment Check Failed ===");
    exit(1);
}

// Helper function to get database health statistics
function getDatabaseStats($database) {
    $db = $database->getConnection();
    
    $query = "
        SELECT 
            COUNT(*) as total_students,
            COUNT(CASE WHEN current_adviser_id IS NOT NULL AND current_adviser_id > 0 THEN 1 END) as assigned_students,
            COUNT(CASE WHEN current_adviser_id IS NULL OR current_adviser_id = 0 THEN 1 END) as unassigned_students
        FROM students 
        WHERE is_active = 1
    ";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    return $stmt->fetch(PDO::FETCH_ASSOC);
}
?>