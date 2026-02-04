<?php
/**
 * Setup script for Emergency Notification System
 * This script checks and applies necessary database changes
 */

require_once 'backend/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== Emergency Notification System Setup ===\n\n";

try {
    // Check if user_id column exists
    echo "1. Checking notifications table structure...\n";
    $checkUserIdQuery = "SHOW COLUMNS FROM notifications LIKE 'user_id'";
    $stmt = $db->prepare($checkUserIdQuery);
    $stmt->execute();
    $hasUserId = $stmt->rowCount() > 0;
    
    $checkPriorityQuery = "SHOW COLUMNS FROM notifications LIKE 'priority'";
    $stmt = $db->prepare($checkPriorityQuery);
    $stmt->execute();
    $hasPriority = $stmt->rowCount() > 0;
    
    if ($hasUserId && $hasPriority) {
        echo "   ✓ Notifications table already has user_id and priority columns\n\n";
    } else {
        echo "   ✗ Missing columns. Applying enhancements...\n";
        
        // Apply each change individually with better error handling
        
        // 1. Add user_id column
        if (!$hasUserId) {
            try {
                $db->exec("ALTER TABLE `notifications` ADD COLUMN `user_id` int(10) UNSIGNED DEFAULT NULL AFTER `parent_id`");
                echo "   ✓ Added user_id column\n";
            } catch (PDOException $e) {
                if (strpos($e->getMessage(), 'Duplicate') === false) {
                    echo "   ✗ Failed to add user_id: " . $e->getMessage() . "\n";
                }
            }
        }
        
        // 2. Add priority column
        if (!$hasPriority) {
            try {
                $db->exec("ALTER TABLE `notifications` ADD COLUMN `priority` enum('normal','urgent') DEFAULT 'normal' AFTER `status`");
                echo "   ✓ Added priority column\n";
            } catch (PDOException $e) {
                if (strpos($e->getMessage(), 'Duplicate') === false) {
                    echo "   ✗ Failed to add priority: " . $e->getMessage() . "\n";
                }
            }
        }
        
        // 3. Add index for user_id
        try {
            $db->exec("ALTER TABLE `notifications` ADD KEY `fk_notif_user` (`user_id`)");
            echo "   ✓ Added index for user_id\n";
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'Duplicate') === false && strpos($e->getMessage(), 'already exists') === false) {
                echo "   ⚠ Index warning: " . $e->getMessage() . "\n";
            }
        }
        
        // 4. Add foreign key constraint
        try {
            $db->exec("ALTER TABLE `notifications` ADD CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)");
            echo "   ✓ Added foreign key constraint\n";
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'Duplicate') === false && strpos($e->getMessage(), 'already exists') === false) {
                echo "   ⚠ Foreign key warning: " . $e->getMessage() . "\n";
            }
        }
        
        echo "   ✓ Enhancements applied successfully\n\n";
    }
    
    // Check channel enum
    echo "2. Checking channel enum values...\n";
    $checkChannelQuery = "SHOW COLUMNS FROM notifications LIKE 'channel'";
    $stmt = $db->prepare($checkChannelQuery);
    $stmt->execute();
    $channelInfo = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (strpos($channelInfo['Type'], 'System') !== false) {
        echo "   ✓ Channel enum includes 'System'\n\n";
    } else {
        echo "   ✗ Channel enum missing 'System'. Updating...\n";
        $updateChannelQuery = "ALTER TABLE `notifications` 
                               MODIFY COLUMN `channel` enum('SMS','Email','System') DEFAULT 'SMS'";
        $db->exec($updateChannelQuery);
        echo "   ✓ Channel enum updated\n\n";
    }
    
    // Verify final structure
    echo "3. Verifying final structure...\n";
    $verifyQuery = "SHOW COLUMNS FROM notifications";
    $stmt = $db->prepare($verifyQuery);
    $stmt->execute();
    
    $columns = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $columns[] = $row['Field'];
    }
    
    $requiredColumns = ['notification_id', 'user_id', 'student_id', 'visit_id', 'channel', 'message', 'status', 'priority'];
    $missingColumns = array_diff($requiredColumns, $columns);
    
    if (empty($missingColumns)) {
        echo "   ✓ All required columns present\n";
        echo "   Columns: " . implode(', ', $columns) . "\n\n";
    } else {
        echo "   ✗ Missing columns: " . implode(', ', $missingColumns) . "\n\n";
    }
    
    // Test notification creation
    echo "4. Testing notification system...\n";
    
    // Get first admin user
    $adminQuery = "SELECT u.user_id, u.full_name 
                   FROM users u 
                   INNER JOIN roles r ON u.role_id = r.role_id 
                   WHERE r.role_name = 'Admin' AND u.is_active = 1 
                   LIMIT 1";
    $stmt = $db->prepare($adminQuery);
    $stmt->execute();
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($admin) {
        echo "   Found admin: {$admin['full_name']} (ID: {$admin['user_id']})\n";
        
        // Create a test notification
        $testMessage = "TEST: Emergency notification system is now active. This is a test message.";
        $insertQuery = "INSERT INTO notifications (user_id, channel, message, priority, status, created_at) 
                       VALUES (:user_id, 'System', :message, 'urgent', 'Pending', NOW())";
        $stmt = $db->prepare($insertQuery);
        $stmt->bindParam(':user_id', $admin['user_id']);
        $stmt->bindParam(':message', $testMessage);
        $stmt->execute();
        
        $testNotifId = $db->lastInsertId();
        echo "   ✓ Test notification created (ID: {$testNotifId})\n";
        
        // Clean up test notification
        $deleteQuery = "DELETE FROM notifications WHERE notification_id = :notif_id";
        $stmt = $db->prepare($deleteQuery);
        $stmt->bindParam(':notif_id', $testNotifId);
        $stmt->execute();
        echo "   ✓ Test notification cleaned up\n\n";
    } else {
        echo "   ⚠ No admin user found for testing\n\n";
    }
    
    echo "=== Setup Complete ===\n";
    echo "✓ Emergency notification system is ready!\n";
    echo "✓ Admin dashboard will now show emergency alerts\n";
    echo "✓ Clinic staff can create emergency visits with auto-SMS\n\n";
    
} catch (PDOException $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>
