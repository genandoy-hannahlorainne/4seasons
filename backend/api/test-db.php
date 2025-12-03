<?php
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Test connection
    if (!$db) {
        throw new Exception("Database connection failed");
    }
    
    // Check roles table
    $roleQuery = "SELECT * FROM roles";
    $roleStmt = $db->prepare($roleQuery);
    $roleStmt->execute();
    $roles = $roleStmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'message' => 'Database connection successful',
        'roles' => $roles
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
