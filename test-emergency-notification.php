<?php
/**
 * Test script to create a sample emergency notification
 * This will help verify that admin can see emergency alerts
 */

require_once 'backend/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== Testing Emergency Notification System ===\n\n";

try {
    // Get first admin user
    echo "1. Finding admin user...\n";
    $adminQuery = "SELECT u.user_id, u.full_name, u.email 
                   FROM users u 
                   INNER JOIN roles r ON u.role_id = r.role_id 
                   WHERE r.role_name = 'Admin' AND u.is_active = 1 
                   LIMIT 1";
    $stmt = $db->prepare($adminQuery);
    $stmt->execute();
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$admin) {
        echo "   ✗ No admin user found!\n";
        exit(1);
    }
    
    echo "   ✓ Found admin: {$admin['full_name']} (ID: {$admin['user_id']})\n\n";
    
    // Get a student
    echo "2. Finding student...\n";
    $studentQuery = "SELECT student_id, first_name, last_name, student_number, grade_level, section 
                     FROM students 
                     WHERE is_active = 1 
                     LIMIT 1";
    $stmt = $db->prepare($studentQuery);
    $stmt->execute();
    $student = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$student) {
        echo "   ✗ No student found!\n";
        exit(1);
    }
    
    $studentName = trim($student['first_name'] . ' ' . $student['last_name']);
    echo "   ✓ Found student: {$studentName} ({$student['student_number']})\n\n";
    
    // Create a test emergency visit
    echo "3. Creating test emergency visit...\n";
    $visitQuery = "INSERT INTO medical_visits (
                    student_id, 
                    visit_datetime, 
                    visit_type,
                    chief_complaint, 
                    notes,
                    status
                  ) VALUES (
                    :student_id,
                    NOW(),
                    'Emergency',
                    'TEST: High fever and difficulty breathing',
                    'This is a test emergency visit for notification system testing.',
                    'Open'
                  )";
    
    $stmt = $db->prepare($visitQuery);
    $stmt->bindParam(':student_id', $student['student_id']);
    $stmt->execute();
    $visitId = $db->lastInsertId();
    
    echo "   ✓ Created emergency visit (ID: {$visitId})\n\n";
    
    // Create emergency notification for admin
    echo "4. Creating emergency notification for admin...\n";
    $message = "EMERGENCY ALERT: Student {$studentName} ({$student['student_number']}) from Grade {$student['grade_level']}-{$student['section']} has been flagged for emergency medical attention. Complaint: High fever and difficulty breathing";
    
    $notifQuery = "INSERT INTO notifications (
                    user_id, 
                    visit_id, 
                    student_id, 
                    channel, 
                    message, 
                    priority, 
                    status, 
                    created_at
                  ) VALUES (
                    :user_id,
                    :visit_id,
                    :student_id,
                    'System',
                    :message,
                    'urgent',
                    'Pending',
                    NOW()
                  )";
    
    $stmt = $db->prepare($notifQuery);
    $stmt->bindParam(':user_id', $admin['user_id']);
    $stmt->bindParam(':visit_id', $visitId);
    $stmt->bindParam(':student_id', $student['student_id']);
    $stmt->bindParam(':message', $message);
    $stmt->execute();
    $notifId = $db->lastInsertId();
    
    echo "   ✓ Created emergency notification (ID: {$notifId})\n\n";
    
    // Verify notification
    echo "5. Verifying notification...\n";
    $verifyQuery = "SELECT n.*, 
                           s.first_name, s.last_name, s.student_number, s.grade_level, s.section
                    FROM notifications n
                    LEFT JOIN students s ON n.student_id = s.student_id
                    WHERE n.notification_id = :notif_id";
    $stmt = $db->prepare($verifyQuery);
    $stmt->bindParam(':notif_id', $notifId);
    $stmt->execute();
    $notification = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($notification) {
        echo "   ✓ Notification verified!\n";
        echo "   - ID: {$notification['notification_id']}\n";
        echo "   - User ID: {$notification['user_id']}\n";
        echo "   - Student: {$notification['first_name']} {$notification['last_name']}\n";
        echo "   - Priority: {$notification['priority']}\n";
        echo "   - Channel: {$notification['channel']}\n";
        echo "   - Status: {$notification['status']}\n\n";
    } else {
        echo "   ✗ Notification not found!\n\n";
    }
    
    echo "=== Test Complete ===\n\n";
    echo "✅ SUCCESS! Emergency notification created!\n\n";
    echo "📋 Next Steps:\n";
    echo "1. Login as Admin: {$admin['full_name']}\n";
    echo "2. Go to Admin Dashboard\n";
    echo "3. You should see a RED EMERGENCY BANNER at the top\n";
    echo "4. The banner will show: \"{$studentName}\" emergency alert\n\n";
    echo "🗑️  To clean up this test:\n";
    echo "   DELETE FROM notifications WHERE notification_id = {$notifId};\n";
    echo "   DELETE FROM medical_visits WHERE visit_id = {$visitId};\n\n";
    
} catch (PDOException $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>
