<?php
require_once 'backend/config/database.php';

echo "=== Checking school_years Table ===\n\n";

$database = new Database();
$db = $database->getConnection();

// Check table structure
echo "Table Structure:\n";
$stmt = $db->query("DESCRIBE school_years");
$columns = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($columns as $col) {
    echo sprintf("  %-20s %-15s %-10s %-10s\n", 
                 $col['Field'], 
                 $col['Type'], 
                 $col['Null'], 
                 $col['Default'] ?? 'NULL');
}

echo "\nCurrent Data:\n";
$stmt = $db->query("SELECT * FROM school_years ORDER BY start_date DESC");
$years = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($years as $year) {
    echo sprintf("ID: %d | %s | Active: %d | Current: %s\n",
                 $year['id'],
                 $year['year_name'],
                 $year['is_active'] ?? 0,
                 isset($year['is_current']) ? $year['is_current'] : 'N/A');
}
?>
