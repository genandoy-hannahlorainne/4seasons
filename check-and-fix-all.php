<?php
/**
 * Check and Fix All Common Issues
 * Comprehensive script to check and fix:
 * - Students without school year/section
 * - Advisers without section assignments
 * - Section assignments
 */

require_once 'backend/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== COMPREHENSIVE DATABASE CHECK ===\n\n";

$issues = [];
$fixes = [];

try {
    // Get active school year
    $syQuery = "SELECT * FROM school_years WHERE is_active = 1";
    $syStmt = $db->query($syQuery);
    $activeSchoolYear = $syStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$activeSchoolYear) {
        echo "❌ CRITICAL: No active school year found!\n";
        echo "Please set one school year as active:\n";
        echo "  UPDATE school_years SET is_active = 0;\n";
        echo "  UPDATE school_years SET is_active = 1 WHERE year_name = '2024-2025';\n";
        exit(1);
    }
    
    echo "Active School Year: {$activeSchoolYear['year_name']} (ID: {$activeSchoolYear['id']})\n\n";
    
    // 1. Check students without school year
    echo "1. Checking students without school year...\n";
    $studentsNoSYQuery = "SELECT COUNT(*) as count FROM students 
                         WHERE is_active = 1 
                         AND (current_school_year_id IS NULL OR current_school_year_id = 0)";
    $studentsNoSYStmt = $db->query($studentsNoSYQuery);
    $studentsNoSY = $studentsNoSYStmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    if ($studentsNoSY > 0) {
        echo "   ⚠️  Found $studentsNoSY student(s) without school year\n";
        $issues[] = "Students without school year: $studentsNoSY";
    } else {
        echo "   ✓ All students have school year\n";
    }
    
    // 2. Check students without section
    echo "\n2. Checking students without section...\n";
    $studentsNoSecQuery = "SELECT COUNT(*) as count FROM students 
                          WHERE is_active = 1 
                          AND (current_section_id IS NULL OR current_section_id = 0)";
    $studentsNoSecStmt = $db->query($studentsNoSecQuery);
    $studentsNoSec = $studentsNoSecStmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    if ($studentsNoSec > 0) {
        echo "   ⚠️  Found $studentsNoSec student(s) without section\n";
        $issues[] = "Students without section: $studentsNoSec";
        
        // List them
        $listQuery = "SELECT student_id, student_number, first_name, last_name, grade_level 
                     FROM students 
                     WHERE is_active = 1 
                     AND (current_section_id IS NULL OR current_section_id = 0)";
        $listStmt = $db->query($listQuery);
        $students = $listStmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($students as $student) {
            echo "      - {$student['first_name']} {$student['last_name']} ({$student['student_number']}) - Grade {$student['grade_level']}\n";
        }
    } else {
        echo "   ✓ All students have section\n";
    }
    
    // 3. Check advisers without section assignments
    echo "\n3. Checking advisers without section assignments...\n";
    $advisersQuery = "SELECT 
                        a.adviser_id,
                        a.user_id,
                        a.first_name,
                        a.last_name,
                        a.grade_level,
                        a.section,
                        COUNT(sec.id) as section_count
                     FROM advisers a
                     LEFT JOIN sections sec ON sec.adviser_id = a.user_id 
                                            AND sec.school_year_id = {$activeSchoolYear['id']}
                     WHERE a.is_active = 1
                     AND a.grade_level IS NOT NULL
                     AND a.section IS NOT NULL
                     GROUP BY a.adviser_id";
    $advisersStmt = $db->query($advisersQuery);
    $advisers = $advisersStmt->fetchAll(PDO::FETCH_ASSOC);
    
    $advisersWithoutSection = 0;
    foreach ($advisers as $adviser) {
        if ($adviser['section_count'] == 0) {
            if ($advisersWithoutSection == 0) {
                echo "   ⚠️  Advisers without section assignment:\n";
            }
            echo "      - {$adviser['first_name']} {$adviser['last_name']} (Grade {$adviser['grade_level']}, Section {$adviser['section']})\n";
            $advisersWithoutSection++;
        }
    }
    
    if ($advisersWithoutSection > 0) {
        $issues[] = "Advisers without section: $advisersWithoutSection";
    } else {
        echo "   ✓ All advisers have section assignments\n";
    }
    
    // 4. Check sections without advisers
    echo "\n4. Checking sections without advisers...\n";
    $sectionsNoAdviserQuery = "SELECT 
                                 gl.level_number,
                                 sec.section_name,
                                 sec.id
                               FROM sections sec
                               JOIN grade_levels gl ON sec.grade_level_id = gl.id
                               WHERE sec.school_year_id = {$activeSchoolYear['id']}
                               AND sec.is_active = 1
                               AND sec.adviser_id IS NULL
                               ORDER BY gl.level_number, sec.section_name";
    $sectionsNoAdviserStmt = $db->query($sectionsNoAdviserQuery);
    $sectionsNoAdviser = $sectionsNoAdviserStmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($sectionsNoAdviser) > 0) {
        echo "   ⚠️  Found " . count($sectionsNoAdviser) . " section(s) without adviser:\n";
        foreach ($sectionsNoAdviser as $sec) {
            echo "      - Grade {$sec['level_number']} Section {$sec['section_name']}\n";
        }
        $issues[] = "Sections without adviser: " . count($sectionsNoAdviser);
    } else {
        echo "   ✓ All sections have advisers\n";
    }
    
    // 5. Summary
    echo "\n" . str_repeat("=", 50) . "\n";
    if (count($issues) > 0) {
        echo "⚠️  ISSUES FOUND:\n";
        foreach ($issues as $issue) {
            echo "  - $issue\n";
        }
        
        echo "\n📋 RECOMMENDED ACTIONS:\n";
        if ($studentsNoSY > 0 || $studentsNoSec > 0) {
            echo "  1. Fix students: php fix-student-school-years.php\n";
        }
        if ($advisersWithoutSection > 0) {
            echo "  2. Fix advisers: php fix-adviser-section-assignments.php\n";
        }
        if (count($sectionsNoAdviser) > 0) {
            echo "  3. Manually assign advisers to sections\n";
        }
    } else {
        echo "✅ NO ISSUES FOUND - Database is properly configured!\n";
    }
    
} catch (Exception $e) {
    echo "\n❌ ERROR: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
?>
