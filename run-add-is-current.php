<?php
/**
 * Add is_current column to school_years table
 */

require_once 'backend/config/database.php';

echo "=== Adding is_current Column to school_years ===\n\n";

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Read the SQL file
    $sql = file_get_contents('database/add-is-current-column.sql');
    
    // Split by semicolons and execute each statement
    $statements = array_filter(
        array_map('trim', explode(';', $sql)),
        function($stmt) {
            return !empty($stmt) && 
                   !preg_match('/^--/', $stmt) && 
                   !preg_match('/^\/\*/', $stmt);
        }
    );
    
    foreach ($statements as $statement) {
        if (stripos($statement, 'SELECT') === 0 && stripos($statement, 'FROM school_years') !== false) {
            // This is the verification query, execute and show results
            $stmt = $db->query($statement);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo "Current School Years:\n";
            echo str_repeat('-', 80) . "\n";
            printf("%-5s %-15s %-12s %-12s %-8s %-8s %s\n", 
                   'ID', 'Year Name', 'Start', 'End', 'Active', 'Current', 'Status');
            echo str_repeat('-', 80) . "\n";
            
            foreach ($results as $row) {
                printf("%-5s %-15s %-12s %-12s %-8s %-8s %s\n",
                       $row['id'],
                       $row['year_name'],
                       $row['start_date'],
                       $row['end_date'],
                       $row['is_active'],
                       $row['is_current'] ?? '0',
                       $row['status'] ?? '');
            }
            echo str_repeat('-', 80) . "\n";
        } else {
            // Execute other statements
            $db->exec($statement);
        }
    }
    
    echo "\n✅ Migration completed successfully!\n";
    echo "\nThe 'is_current' column has been added to the school_years table.\n";
    echo "The most recent active school year has been set as current.\n";
    
} catch (Exception $e) {
    echo "\n❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>
