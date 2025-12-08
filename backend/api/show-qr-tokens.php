<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $query = "SELECT 
                qr.qr_id,
                qr.student_id,
                s.student_number,
                s.first_name,
                s.last_name,
                qr.qr_token,
                qr.qr_generated_at
              FROM qr_codes qr
              JOIN students s ON qr.student_id = s.student_id
              ORDER BY qr.student_id";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    $qr_codes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'total' => count($qr_codes),
        'qr_codes' => $qr_codes
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>
