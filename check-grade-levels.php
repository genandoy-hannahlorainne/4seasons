<?php
require_once 'backend/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "Grade Levels:\n";
$stmt = $db->query("SELECT * FROM grade_levels ORDER BY level_number");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo sprintf("  ID: %d | %s (Level %d)\n", 
                 $row['id'], 
                 $row['level_name'], 
                 $row['level_number']);
}
?>
