<?php
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';

$username = $_GET['username'] ?? '';

if (empty($username)) {
    echo json_encode([
        'success' => false,
        'message' => 'Usage: delete-test-user.php?username=2023-99999-TG-0'
    ]);
    exit;
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $db->beginTransaction();
    
    $query = "SELECT user_id, username FROM users WHERE username = :username";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":username", $username);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        throw new Exception("User not found: " . $username);
    }
    
    $user_id = $user['user_id'];
    
    $tables = [
        'activity_logs' => 'user_id',
        'students' => 'user_id',
        'advisers' => 'user_id',
        'clinic_staff' => 'user_id',
        'users' => 'user_id'
    ];
    
    foreach ($tables as $table => $column) {
        $deleteQuery = "DELETE FROM $table WHERE $column = :user_id";
        $deleteStmt = $db->prepare($deleteQuery);
        $deleteStmt->bindParam(":user_id", $user_id);
        $deleteStmt->execute();
    }
    
    $db->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'User deleted successfully',
        'username' => $username,
        'user_id' => $user_id
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
