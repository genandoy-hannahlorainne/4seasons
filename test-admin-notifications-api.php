<?php
/**
 * Test script for admin notifications API
 * This will help debug the 500 error
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'backend/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== Testing Admin Notifications API ===\n\n";

try {
    // Get admin user
    echo "1. Finding admin user...\n";
    $adminQuery = "SELECT u.user_id, u.full_name 
                   FROM users u 
                   INNER JOIN roles r ON u.role_id = r.role_id 
                   WHERE r.role_name = 'Admin' AND u.is_active = 1 
                   LIMIT 1";
    $stmt = $db->prepare($adminQuery);
    $stmt->execute();
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$admin) {
        echo "   ✗ No admin found!\n";
        exit(1);
    }
    
    echo "   ✓ Admin: {$admin['full_name']} (ID: {$admin['user_id']})\n\n";
    
    // Test the query
    echo "2. Testing notifications query...\n";
    $query = "SELECT n.*, 
                     s.first_name, s.last_name, s.student_number, s.grade_level, s.section,
                     mv.visit_type, mv.chief_complaint, mv.status as visit_status,
                     cs.position as staff_position,
                     u.full_name as staff_name
              FROM notifications n
              LEFT JOIN students s ON n.student_id = s.student_id
              LEFT JOIN medical_visits mv ON n.visit_id = mv.visit_id
              LEFT JOIN clinic_staff cs ON mv.clinic_staff_id = cs.clinic_staff_id
              LEFT JOIN users u ON cs.user_id = u.user_id
              WHERE n.user_id = :user_id 
                AND n.channel = 'System'
              ORDER BY n.created_at DESC
              LIMIT 50";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $admin['user_id']);
    $stmt->execute();
    
    echo "   ✓ Query executed successfully\n";
    echo "   Found " . $stmt->rowCount() . " notifications\n\n";
    
    // Fetch and display results
    echo "3. Fetching notification data...\n";
    $notifications = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "   - Notification ID: {$row['notification_id']}\n";
        echo "     Student: {$row['first_name']} {$row['last_name']}\n";
        echo "     Visit ID: " . ($row['visit_id'] ?? 'NULL') . "\n";
        echo "     Priority: " . ($row['priority'] ?? 'NULL') . "\n";
        echo "     Channel: {$row['channel']}\n";
        echo "\n";
        
        $notifications[] = [
            'notification_id' => $row['notification_id'],
            'message' => $row['message'],
            'priority' => $row['priority'] ?? 'normal',
            'status' => $row['status'],
            'created_at' => $row['created_at'],
            'student' => [
                'student_id' => $row['student_id'],
                'full_name' => $row['first_name'] && $row['last_name'] 
                    ? trim($row['first_name'] . ' ' . $row['last_name']) 
                    : 'Unknown Student',
                'student_number' => $row['student_number'] ?? 'N/A',
                'grade_section' => ($row['grade_level'] && $row['section']) 
                    ? $row['grade_level'] . '-' . $row['section'] 
                    : 'N/A'
            ],
            'visit' => [
                'visit_id' => $row['visit_id'] ?? null,
                'visit_type' => $row['visit_type'] ?? 'N/A',
                'chief_complaint' => $row['chief_complaint'] ?? 'N/A',
                'status' => $row['visit_status'] ?? 'N/A'
            ],
            'staff' => [
                'name' => $row['staff_name'] ?? 'N/A',
                'position' => $row['staff_position'] ?? 'N/A'
            ]
        ];
    }
    
    echo "4. JSON encoding...\n";
    $json = json_encode([
        'success' => true,
        'notifications' => $notifications,
        'total' => count($notifications)
    ], JSON_PRETTY_PRINT);
    
    if ($json === false) {
        echo "   ✗ JSON encoding failed: " . json_last_error_msg() . "\n";
    } else {
        echo "   ✓ JSON encoded successfully\n\n";
        echo "5. Result:\n";
        echo $json . "\n";
    }
    
} catch (PDOException $e) {
    echo "✗ Database Error: " . $e->getMessage() . "\n";
    echo "   File: " . $e->getFile() . "\n";
    echo "   Line: " . $e->getLine() . "\n";
    exit(1);
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    echo "   File: " . $e->getFile() . "\n";
    echo "   Line: " . $e->getLine() . "\n";
    exit(1);
}
?>
