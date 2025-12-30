<?php
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

// Set password for user 00001
$username = '00001';
$password = 'password';
$password_hash = password_hash($password, PASSWORD_DEFAULT);

$query = "UPDATE users SET password_hash = :password_hash WHERE username = :username";
$stmt = $db->prepare($query);
$stmt->bindParam(":password_hash", $password_hash);
$stmt->bindParam(":username", $username);

if ($stmt->execute()) {
    echo "Password set successfully for user: $username\n";
    echo "Password: $password\n";
    echo "Hash: $password_hash\n";
} else {
    echo "Failed to set password\n";
}
?>
