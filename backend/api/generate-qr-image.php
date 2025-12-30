<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/database.php';

// Get student_id from query parameter
$student_id = $_GET['student_id'] ?? null;

if (!$student_id) {
    header('Content-Type: image/png');
    outputErrorImage('Student ID Required');
    exit;
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Get or create QR code token
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
    $query = "SELECT student_number, first_name, last_name FROM students WHERE student_id = :student_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':student_id', $student_id);
    $stmt->execute();
    $student = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$student) {
        header('Content-Type: image/png');
        outputErrorImage('Student Not Found');
        exit;
    }
    
    // Create QR code content
    $qr_content = json_encode([
        'student_id' => (int)$student_id,
        'student_number' => $student['student_number'],
        'name' => $student['first_name'] . ' ' . $student['last_name'],
        'token' => $qr_token
    ]);
    
    // Generate QR code using goqr.me API (free, no API key needed)
    $qr_url = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' . urlencode($qr_content);
    
    // Set up context for the request
    $context = stream_context_create([
        'http' => [
            'timeout' => 10,
            'user_agent' => 'Mozilla/5.0'
        ]
    ]);
    
    $qr_image = @file_get_contents($qr_url, false, $context);
    
    if ($qr_image === false) {
        // Fallback: Generate a simple QR-like placeholder with student info
        header('Content-Type: image/png');
        generateFallbackQR($student['student_number'], $student['first_name'] . ' ' . $student['last_name'], $qr_token);
        exit;
    }
    
    header('Content-Type: image/png');
    echo $qr_image;
    
} catch (Exception $e) {
    header('Content-Type: image/png');
    outputErrorImage('Error: ' . substr($e->getMessage(), 0, 30));
}

function outputErrorImage($message) {
    $im = imagecreate(300, 300);
    $bg = imagecolorallocate($im, 255, 255, 255);
    $text_color = imagecolorallocate($im, 200, 0, 0);
    $border_color = imagecolorallocate($im, 200, 200, 200);
    
    imagerectangle($im, 0, 0, 299, 299, $border_color);
    
    // Center the text
    $font_size = 4;
    $text_width = imagefontwidth($font_size) * strlen($message);
    $x = (300 - $text_width) / 2;
    
    imagestring($im, $font_size, $x, 140, $message, $text_color);
    imagepng($im);
    imagedestroy($im);
}

function generateFallbackQR($student_number, $name, $token) {
    $size = 300;
    $im = imagecreatetruecolor($size, $size);
    
    // Colors
    $white = imagecolorallocate($im, 255, 255, 255);
    $black = imagecolorallocate($im, 0, 0, 0);
    $blue = imagecolorallocate($im, 0, 123, 255);
    $gray = imagecolorallocate($im, 100, 100, 100);
    
    // Fill background
    imagefill($im, 0, 0, $white);
    
    // Draw border
    imagerectangle($im, 0, 0, $size-1, $size-1, $black);
    imagerectangle($im, 5, 5, $size-6, $size-6, $black);
    
    // Draw corner squares (QR code style)
    $corner_size = 40;
    // Top-left
    imagefilledrectangle($im, 15, 15, 15 + $corner_size, 15 + $corner_size, $black);
    imagefilledrectangle($im, 20, 20, 10 + $corner_size, 10 + $corner_size, $white);
    imagefilledrectangle($im, 25, 25, 5 + $corner_size, 5 + $corner_size, $black);
    
    // Top-right
    imagefilledrectangle($im, $size - 15 - $corner_size, 15, $size - 15, 15 + $corner_size, $black);
    imagefilledrectangle($im, $size - 10 - $corner_size, 20, $size - 20, 10 + $corner_size, $white);
    imagefilledrectangle($im, $size - 5 - $corner_size, 25, $size - 25, 5 + $corner_size, $black);
    
    // Bottom-left
    imagefilledrectangle($im, 15, $size - 15 - $corner_size, 15 + $corner_size, $size - 15, $black);
    imagefilledrectangle($im, 20, $size - 10 - $corner_size, 10 + $corner_size, $size - 20, $white);
    imagefilledrectangle($im, 25, $size - 5 - $corner_size, 5 + $corner_size, $size - 25, $black);
    
    // Draw student info in center
    $y = 100;
    
    // Student Number
    $text = "ID: " . $student_number;
    $text_width = imagefontwidth(5) * strlen($text);
    imagestring($im, 5, ($size - $text_width) / 2, $y, $text, $blue);
    
    // Name (truncate if too long)
    $y += 30;
    if (strlen($name) > 20) {
        $name = substr($name, 0, 17) . '...';
    }
    $text_width = imagefontwidth(4) * strlen($name);
    imagestring($im, 4, ($size - $text_width) / 2, $y, $name, $gray);
    
    // Token (first 8 chars)
    $y += 30;
    $text = "Token: " . substr($token, 0, 8) . "...";
    $text_width = imagefontwidth(3) * strlen($text);
    imagestring($im, 3, ($size - $text_width) / 2, $y, $text, $gray);
    
    // Add some random dots for QR effect
    for ($i = 0; $i < 100; $i++) {
        $x = rand(70, 230);
        $y = rand(180, 270);
        $dot_size = rand(3, 8);
        imagefilledrectangle($im, $x, $y, $x + $dot_size, $y + $dot_size, $black);
    }
    
    imagepng($im);
    imagedestroy($im);
}
?>
