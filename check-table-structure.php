<?php
/**
 * Check the actual structure of medical_visits table
 */

require_once 'backend-laravel/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'backend-laravel/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Checking Medical Visits Table Structure ===\n\n";

try {
    // Get table structure
    $columns = DB::select("DESCRIBE medical_visits");
    
    echo "Medical visits table columns:\n";
    foreach ($columns as $column) {
        echo "- {$column->Field} ({$column->Type}) - {$column->Null} - {$column->Key}\n";
    }
    
    // Check if table has any data
    $count = DB::table('medical_visits')->count();
    echo "\nTotal records: $count\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

echo "\n=== Check Complete ===\n";
?>