<?php

require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "Checking students with section assignments...\n";

// Check students with section assignments
$students = DB::select('SELECT student_id, first_name, last_name, current_section_id, grade_level FROM students WHERE current_section_id IS NOT NULL');
echo "Students with section assignments: " . count($students) . "\n\n";

if (count($students) > 0) {
    echo "Students that need section ID updates:\n";
    echo "=====================================\n";
    
    foreach ($students as $student) {
        // Find the correct section for this student
        $gradeLevel = (int)$student->grade_level;
        $gradeLevelId = null;
        
        // Map grade level to grade_level_id
        switch ($gradeLevel) {
            case 7: $gradeLevelId = 1; break;
            case 8: $gradeLevelId = 2; break;
            case 9: $gradeLevelId = 3; break;
            case 10: $gradeLevelId = 4; break;
            case 11: $gradeLevelId = 5; break;
            case 12: $gradeLevelId = 6; break;
        }
        
        if ($gradeLevelId) {
            // Get available sections for this grade level
            $sections = DB::select('SELECT id, section_name FROM sections WHERE grade_level_id = ? ORDER BY section_name', [$gradeLevelId]);
            
            echo "• {$student->first_name} {$student->last_name} (Grade {$gradeLevel})\n";
            echo "  Current section_id: {$student->current_section_id}\n";
            echo "  Available sections: ";
            foreach ($sections as $section) {
                echo "{$section->id}={$section->section_name} ";
            }
            echo "\n\n";
        }
    }
    
    echo "Note: You may need to manually update student section assignments\n";
    echo "or assign them to appropriate sections based on their previous assignments.\n";
} else {
    echo "✅ No students have section assignments that need updating.\n";
}