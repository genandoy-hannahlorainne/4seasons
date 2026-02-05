<?php
require 'backend/config/database.php';

$db = (new Database())->getConnection();

echo "=== Checking for Parent-Related Tables ===\n\n";

$stmt = $db->query("SHOW TABLES");
$tables = $stmt->fetchAll(PDO::FETCH_NUM);

echo "Tables with 'parent' in name:\n";
foreach ($tables as $table) {
    if (stripos($table[0], 'parent') !== false) {
        echo "  - " . $table[0] . "\n";
    }
}

echo "\n=== Checking students table structure ===\n";
$stmt = $db->query("DESCRIBE students");
while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    if(stripos($row['Field'], 'emergency') !== false || stripos($row['Field'], 'parent') !== false) {
        echo "  " . $row['Field'] . " (" . $row['Type'] . ")\n";
    }
}
?>
