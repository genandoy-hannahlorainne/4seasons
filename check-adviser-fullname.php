<?php
require 'backend/config/database.php';

$db = new Database();
$conn = $db->getConnection();

$stmt = $conn->query("SELECT u.user_id, u.full_name, r.role_name FROM users u LEFT JOIN roles r ON u.role_id = r.role_id WHERE r.role_name = 'Adviser' LIMIT 3");

echo "Checking adviser full names:\n\n";

while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "ID: " . $row['user_id'] . "\n";
    echo "Name: [" . $row['full_name'] . "]\n";
    echo "Length: " . strlen($row['full_name']) . "\n";
    echo "Has double space: " . (strpos($row['full_name'], '  ') !== false ? 'YES' : 'NO') . "\n";
    echo "---\n";
}
