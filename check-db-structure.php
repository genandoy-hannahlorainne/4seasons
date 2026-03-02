<?php
require_once 'backend-laravel/vendor/autoload.php';
$app = require_once 'backend-laravel/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Check students table structure
$columns = \DB::select('DESCRIBE students');
echo "Students table columns:\n";
foreach ($columns as $column) {
    echo "- {$column->Field} ({$column->Type})\n";
}

// Check if we have any students with BMI data
$studentsWithBMI = \DB::select("
    SELECT COUNT(*) as count 
    FROM students 
    WHERE bmi IS NOT NULL 
    AND bmi_category IS NOT NULL
")[0];

echo "\nStudents with BMI data: {$studentsWithBMI->count}\n";

// Test the problematic query
try {
    $result = \DB::select("
        SELECT 
            s.grade_level,
            COUNT(*) as total_students
        FROM students s 
        WHERE s.is_active = 1 
        LIMIT 5
    ");
    
    echo "\nTest query successful:\n";
    foreach ($result as $row) {
        echo "- Grade {$row->grade_level}: {$row->total_students} students\n";
    }
} catch (Exception $e) {
    echo "\nTest query failed: " . $e->getMessage() . "\n";
}
?>