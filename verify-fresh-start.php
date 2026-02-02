<?php
/**
 * Verify Fresh Start Setup
 * Run this after setting up school years to verify everything is configured correctly
 */

require_once 'backend/config/database.php';

echo "=== Fresh Start Setup Verification ===\n\n";

$database = new Database();
$db = $database->getConnection();

// Check 1: School Years
echo "1. Checking School Years...\n";
$syStmt = $db->query("SELECT COUNT(*) as count FROM school_years");
$syCount = $syStmt->fetch(PDO::FETCH_ASSOC)['count'];
echo "   Total school years: $syCount\n";

if ($syCount > 0) {
    echo "   ✅ School years exist\n";
    
    // Check for current school year
    $currentStmt = $db->query("SELECT id, year_name FROM school_years WHERE is_current = 1");
    $current = $currentStmt->fetch(PDO::FETCH_ASSOC);
    
    if ($current) {
        echo "   ✅ Current school year: {$current['year_name']} (ID: {$current['id']})\n";
        $currentSchoolYearId = $current['id'];
    } else {
        echo "   ⚠️  No current school year set. Use 'Set as Current' button in admin panel.\n";
        $currentSchoolYearId = null;
    }
} else {
    echo "   ❌ No school years found. Create one in the admin panel.\n";
    $currentSchoolYearId = null;
}

echo "\n";

// Check 2: Sections
echo "2. Checking Sections...\n";
if ($currentSchoolYearId) {
    $sectionsStmt = $db->prepare("SELECT COUNT(*) as count FROM sections WHERE school_year_id = ?");
    $sectionsStmt->execute([$currentSchoolYearId]);
    $sectionsCount = $sectionsStmt->fetch(PDO::FETCH_ASSOC)['count'];
    echo "   Sections for current school year: $sectionsCount\n";
    
    if ($sectionsCount > 0) {
        echo "   ✅ Sections exist\n";
        
        // Check sections with advisers
        $adviserStmt = $db->prepare("SELECT COUNT(*) as count FROM sections WHERE school_year_id = ? AND adviser_id IS NOT NULL");
        $adviserStmt->execute([$currentSchoolYearId]);
        $withAdviser = $adviserStmt->fetch(PDO::FETCH_ASSOC)['count'];
        $withoutAdviser = $sectionsCount - $withAdviser;
        
        echo "   - Sections with adviser: $withAdviser\n";
        echo "   - Sections without adviser: $withoutAdviser\n";
        
        if ($withoutAdviser > 0) {
            echo "   ⚠️  Some sections don't have advisers assigned\n";
        } else {
            echo "   ✅ All sections have advisers\n";
        }
    } else {
        echo "   ⚠️  No sections created yet. Create sections in admin panel.\n";
    }
} else {
    echo "   ⏭️  Skipped (no current school year)\n";
}

echo "\n";

// Check 3: Users
echo "3. Checking Users...\n";
$usersStmt = $db->query("
    SELECT r.role_name, COUNT(*) as count 
    FROM users u 
    JOIN roles r ON u.role_id = r.role_id 
    WHERE u.deleted_at IS NULL
    GROUP BY r.role_name
");
$users = $usersStmt->fetchAll(PDO::FETCH_ASSOC);

if (count($users) > 0) {
    foreach ($users as $user) {
        echo "   - {$user['role_name']}: {$user['count']}\n";
    }
    echo "   ✅ Users exist\n";
} else {
    echo "   ⚠️  Only admin account exists\n";
}

echo "\n";

// Check 4: Students
echo "4. Checking Students...\n";
$studentsStmt = $db->query("SELECT COUNT(*) as count FROM students");
$studentsCount = $studentsStmt->fetch(PDO::FETCH_ASSOC)['count'];
echo "   Total students: $studentsCount\n";

if ($studentsCount > 0) {
    echo "   ✅ Students exist\n";
    
    if ($currentSchoolYearId) {
        // Check students in current school year
        $currentStudentsStmt = $db->prepare("SELECT COUNT(*) as count FROM students WHERE current_school_year_id = ?");
        $currentStudentsStmt->execute([$currentSchoolYearId]);
        $currentStudents = $currentStudentsStmt->fetch(PDO::FETCH_ASSOC)['count'];
        echo "   - Students in current school year: $currentStudents\n";
        
        // Check students with advisers
        $withAdviserStmt = $db->prepare("SELECT COUNT(*) as count FROM students WHERE current_school_year_id = ? AND current_adviser_id IS NOT NULL");
        $withAdviserStmt->execute([$currentSchoolYearId]);
        $studentsWithAdviser = $withAdviserStmt->fetch(PDO::FETCH_ASSOC)['count'];
        $studentsWithoutAdviser = $currentStudents - $studentsWithAdviser;
        
        echo "   - Students with adviser: $studentsWithAdviser\n";
        echo "   - Students without adviser: $studentsWithoutAdviser\n";
        
        if ($studentsWithoutAdviser > 0) {
            echo "   ⚠️  Some students don't have advisers (assign advisers to their sections)\n";
        } else {
            echo "   ✅ All students have advisers\n";
        }
    }
} else {
    echo "   ℹ️  No students yet (fresh start)\n";
}

echo "\n";

// Summary
echo "=== Summary ===\n";
if ($currentSchoolYearId) {
    echo "✅ System is ready! Current school year is set.\n";
    echo "\nNext steps:\n";
    if ($sectionsCount == 0) {
        echo "1. Create sections for the current school year\n";
        echo "2. Assign advisers to sections\n";
        echo "3. Create student accounts\n";
    } elseif ($withAdviser < $sectionsCount) {
        echo "1. Assign advisers to remaining sections\n";
        echo "2. Create student accounts\n";
    } else {
        echo "1. Create student accounts (they will auto-assign to current year & advisers)\n";
    }
} else {
    echo "⚠️  Setup incomplete. Follow these steps:\n";
    echo "1. Create a school year in admin panel\n";
    echo "2. Set it as current using 'Set as Current' button\n";
    echo "3. Create sections for that school year\n";
    echo "4. Assign advisers to sections\n";
    echo "5. Create student accounts\n";
}

echo "\n";
?>
