<?php
require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "<h1>QR Codes Table Structure</h1>";

try {
    $query = "DESCRIBE qr_codes";
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    echo "<table border='1'>";
    echo "<tr><th>Field</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th><th>Extra</th></tr>";
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "<tr>";
        echo "<td>" . $row['Field'] . "</td>";
        echo "<td>" . $row['Type'] . "</td>";
        echo "<td>" . $row['Null'] . "</td>";
        echo "<td>" . $row['Key'] . "</td>";
        echo "<td>" . $row['Default'] . "</td>";
        echo "<td>" . $row['Extra'] . "</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    // Show sample data
    echo "<h2>Sample Data</h2>";
    $query2 = "SELECT * FROM qr_codes LIMIT 5";
    $stmt2 = $db->prepare($query2);
    $stmt2->execute();
    
    echo "<pre>";
    while ($row = $stmt2->fetch(PDO::FETCH_ASSOC)) {
        print_r($row);
    }
    echo "</pre>";
    
} catch (PDOException $e) {
    echo "<p style='color: red;'>Error: " . $e->getMessage() . "</p>";
}

// Suggest fix
echo "<h2>Fix SQL</h2>";
echo "<pre>";
echo "ALTER TABLE qr_codes ADD COLUMN qr_data TEXT AFTER student_id;";
echo "</pre>";
?>
