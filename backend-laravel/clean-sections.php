<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "Starting sections table cleanup...\n";

try {
    // Delete all existing sections
    DB::statement('DELETE FROM sections');
    echo "✅ Deleted all existing sections\n";
    
    // Reset auto increment
    DB::statement('ALTER TABLE sections AUTO_INCREMENT = 1');
    echo "✅ Reset auto increment\n";
    
    // Get current school year ID
    $currentSchoolYear = DB::table('school_years')->where('is_current', 1)->first();
    if (!$currentSchoolYear) {
        echo "❌ No current school year found\n";
        exit(1);
    }
    
    $schoolYearId = $currentSchoolYear->id;
    echo "✅ Using school year ID: {$schoolYearId} ({$currentSchoolYear->year_name})\n";
    
    // Insert Grade 7 sections (3 sections)
    $grade7Sections = [
        ['section_name' => 'Mapagmahal', 'grade_level_id' => 1],
        ['section_name' => 'Matatag', 'grade_level_id' => 1],
        ['section_name' => 'Masigasig', 'grade_level_id' => 1]
    ];
    
    foreach ($grade7Sections as $section) {
        DB::table('sections')->insert([
            'section_name' => $section['section_name'],
            'grade_level_id' => $section['grade_level_id'],
            'school_year_id' => $schoolYearId,
            'capacity' => 50,
            'current_enrollment' => 0,
            'is_active' => 1,
            'created_at' => now()
        ]);
    }
    echo "✅ Inserted Grade 7 sections (3)\n";
    
    // Insert Grade 8 sections (3 sections)
    $grade8Sections = [
        ['section_name' => 'Mapagmahal', 'grade_level_id' => 2],
        ['section_name' => 'Matatag', 'grade_level_id' => 2],
        ['section_name' => 'Masigasig', 'grade_level_id' => 2]
    ];
    
    foreach ($grade8Sections as $section) {
        DB::table('sections')->insert([
            'section_name' => $section['section_name'],
            'grade_level_id' => $section['grade_level_id'],
            'school_year_id' => $schoolYearId,
            'capacity' => 50,
            'current_enrollment' => 0,
            'is_active' => 1,
            'created_at' => now()
        ]);
    }
    echo "✅ Inserted Grade 8 sections (3)\n";
    
    // Insert Grade 9 sections (3 sections)
    $grade9Sections = [
        ['section_name' => 'Mapagmahal', 'grade_level_id' => 3],
        ['section_name' => 'Matatag', 'grade_level_id' => 3],
        ['section_name' => 'Masigasig', 'grade_level_id' => 3]
    ];
    
    foreach ($grade9Sections as $section) {
        DB::table('sections')->insert([
            'section_name' => $section['section_name'],
            'grade_level_id' => $section['grade_level_id'],
            'school_year_id' => $schoolYearId,
            'capacity' => 50,
            'current_enrollment' => 0,
            'is_active' => 1,
            'created_at' => now()
        ]);
    }
    echo "✅ Inserted Grade 9 sections (3)\n";
    
    // Insert Grade 10 sections (3 sections)
    $grade10Sections = [
        ['section_name' => 'Mapagmahal', 'grade_level_id' => 4],
        ['section_name' => 'Matatag', 'grade_level_id' => 4],
        ['section_name' => 'Masigasig', 'grade_level_id' => 4]
    ];
    
    foreach ($grade10Sections as $section) {
        DB::table('sections')->insert([
            'section_name' => $section['section_name'],
            'grade_level_id' => $section['grade_level_id'],
            'school_year_id' => $schoolYearId,
            'capacity' => 50,
            'current_enrollment' => 0,
            'is_active' => 1,
            'created_at' => now()
        ]);
    }
    echo "✅ Inserted Grade 10 sections (3)\n";
    
    // Insert Grade 11 sections (2 per strand = 10 total)
    $grade11Sections = [
        ['section_name' => 'STEM 1', 'grade_level_id' => 5],
        ['section_name' => 'STEM 2', 'grade_level_id' => 5],
        ['section_name' => 'ABM 1', 'grade_level_id' => 5],
        ['section_name' => 'ABM 2', 'grade_level_id' => 5],
        ['section_name' => 'HUMSS 1', 'grade_level_id' => 5],
        ['section_name' => 'HUMSS 2', 'grade_level_id' => 5],
        ['section_name' => 'TVL-HE 1', 'grade_level_id' => 5],
        ['section_name' => 'TVL-HE 2', 'grade_level_id' => 5],
        ['section_name' => 'TVL-EIM 1', 'grade_level_id' => 5],
        ['section_name' => 'TVL-EIM 2', 'grade_level_id' => 5]
    ];
    
    foreach ($grade11Sections as $section) {
        DB::table('sections')->insert([
            'section_name' => $section['section_name'],
            'grade_level_id' => $section['grade_level_id'],
            'school_year_id' => $schoolYearId,
            'capacity' => 50,
            'current_enrollment' => 0,
            'is_active' => 1,
            'created_at' => now()
        ]);
    }
    echo "✅ Inserted Grade 11 sections (10)\n";
    
    // Insert Grade 12 sections (2 per strand = 10 total)
    $grade12Sections = [
        ['section_name' => 'STEM 1', 'grade_level_id' => 6],
        ['section_name' => 'STEM 2', 'grade_level_id' => 6],
        ['section_name' => 'ABM 1', 'grade_level_id' => 6],
        ['section_name' => 'ABM 2', 'grade_level_id' => 6],
        ['section_name' => 'HUMSS 1', 'grade_level_id' => 6],
        ['section_name' => 'HUMSS 2', 'grade_level_id' => 6],
        ['section_name' => 'TVL-HE 1', 'grade_level_id' => 6],
        ['section_name' => 'TVL-HE 2', 'grade_level_id' => 6],
        ['section_name' => 'TVL-EIM 1', 'grade_level_id' => 6],
        ['section_name' => 'TVL-EIM 2', 'grade_level_id' => 6]
    ];
    
    foreach ($grade12Sections as $section) {
        DB::table('sections')->insert([
            'section_name' => $section['section_name'],
            'grade_level_id' => $section['grade_level_id'],
            'school_year_id' => $schoolYearId,
            'capacity' => 50,
            'current_enrollment' => 0,
            'is_active' => 1,
            'created_at' => now()
        ]);
    }
    echo "✅ Inserted Grade 12 sections (10)\n";
    
    // Show summary
    $summary = DB::select("
        SELECT 
            gl.level_name,
            COUNT(s.id) as section_count,
            GROUP_CONCAT(s.section_name ORDER BY s.section_name SEPARATOR ', ') as sections
        FROM sections s
        JOIN grade_levels gl ON s.grade_level_id = gl.id
        WHERE s.school_year_id = ?
        GROUP BY gl.id, gl.level_name
        ORDER BY gl.level_number
    ", [$schoolYearId]);
    
    echo "\n📊 SECTIONS SUMMARY:\n";
    echo "==================\n";
    foreach ($summary as $row) {
        echo "• {$row->level_name}: {$row->section_count} sections ({$row->sections})\n";
    }
    
    echo "\n🎉 Sections table cleanup completed successfully!\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}