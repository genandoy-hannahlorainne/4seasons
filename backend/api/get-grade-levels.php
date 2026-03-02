<?php
/**
 * Get grade levels - Legacy API endpoint
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, user_id');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../config/database.php';

try {
    // Create database connection
    $database = new Database();
    $pdo = $database->getConnection();

    if (!$pdo) {
        echo json_encode([
            'success' => false,
            'message' => 'Database connection failed'
        ]);
        exit;
    }

    // Get all active grade levels
    $stmt = $pdo->prepare("
        SELECT id, level_number, level_name, is_active 
        FROM grade_levels 
        WHERE is_active = 1 
        ORDER BY level_number
    ");
    $stmt->execute();
    $gradeLevels = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format the response
    $formattedGradeLevels = array_map(function($grade) {
        return [
            'id' => (int)$grade['id'],
            'level_number' => (int)$grade['level_number'],
            'level_name' => $grade['level_name'],
            'is_active' => (bool)$grade['is_active']
        ];
    }, $gradeLevels);

    echo json_encode([
        'success' => true,
        'data' => $formattedGradeLevels,
        'message' => 'Grade levels retrieved successfully'
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Failed to retrieve grade levels: ' . $e->getMessage()
    ]);
}
?>