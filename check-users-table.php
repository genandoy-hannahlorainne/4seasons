<?php
require_once 'backend/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== Users Table Structure ===\n\n";
$stmt = $db->query('DESCRIBE users');
while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo $row['Field'] . ' - ' . $row['Type'] . "\n";
}

echo "\n=== Diane's Record ===\n\n";
$query = "SELECT * FROM users WHERE email LIKE '%diane%'";
$stmt = $db->prepare($query);
$stmt->execute();
$diane = $stmt->fetch(PDO::FETCH_ASSOC);

if ($diane) {
    foreach ($diane as $key => $value) {
        echo "$key: $value\n";
    }
}
?>
