<?php
header('Content-Type: image/png');
header('Access-Control-Allow-Origin: *');

require_once '../config/database.php';

// Get student_id from query parameter
$student_id = $_GET['student_id'] ?? null;

if (!$student_id) {
    // Return error image
    $im = imagecreate(300, 300);
    $bg = imagecolorallocate($im, 255, 255, 255);
    $text_color = imagecolorallocate($im, 0, 0, 0);
    imagestring($im, 5, 50, 140, 'Student ID Required', $text_color);
    imagepng($im);
    imagedestroy($im);
    exit;
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Get or create QR code
    $query = "SELECT qr_token FROM qr_codes WHERE student_id = :student_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':student_id', $student_id);
    $stmt->execute();
    
    $qr_data = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$qr_data) {
        // Generate new token
        $qr_token = bin2hex(random_bytes(16));
        
        $query = "INSERT INTO qr_codes (student_id, qr_token, qr_generated_at) 
                 VALUES (:student_id, :qr_token, NOW())";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':student_id', $student_id);
        $stmt->bindParam(':qr_token', $qr_token);
        $stmt->execute();
    } else {
        $qr_token = $qr_data['qr_token'];
    }
    
    // Get student info
    $query = "SELECT student_number FROM students WHERE student_id = :student_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':student_id', $student_id);
    $stmt->execute();
    $student = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Create QR code content
    $qr_content = json_encode([
        'student_id' => (int)$student_id,
        'student_number' => $student['student_number'],
        'token' => $qr_token
    ]);
    
    // Use Google Charts API to generate QR code
    $qr_url = 'https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=' . urlencode($qr_content);
    
    // Fetch and output the QR code image
    $qr_image = file_get_contents($qr_url);
    echo $qr_image;
    
} catch (Exception $e) {
    // Return error image
    $im = imagecreate(300, 300);
    $bg = imagecolorallocate($im, 255, 255, 255);
    $text_color = imagecolorallocate($im, 255, 0, 0);
    imagestring($im, 5, 50, 140, 'Error: ' . $e->getMessage(), $text_color);
    imagepng($im);
    imagedestroy($im);
}
?>
