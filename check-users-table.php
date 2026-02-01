<?php
require_once 'backend/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "Users table structure:\n";
$stmt = $db->query("DESCRIBE users");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "  {$row['Field']} - {$row['Type']}\n";
}
?>
