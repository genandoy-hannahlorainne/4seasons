<?php
require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$username = isset($_GET['username']) ? $_GET['username'] : '136883100331';

$query = "SELECT user_id, username, email, full_name, temp_password, password_must_change, created_at 
          FROM users 
          WHERE username = :username 
          ORDER BY created_at DESC 
          LIMIT 1";

$stmt = $db->prepare($query);
$stmt->bindParam(':username', $username);
$stmt->execute();

$user = $stmt->fetch(PDO::FETCH_ASSOC);

header('Content-Type: application/json');
if ($user) {
    echo json_encode([
        'found' => true,
        'user' => $user
    ], JSON_PRETTY_PRINT);
} else {
    echo json_encode([
        'found' => false,
        'message' => 'User not found',
        'searched_username' => $username
    ], JSON_PRETTY_PRINT);
}
?>
