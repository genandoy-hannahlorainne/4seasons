-- =====================================================
-- REVIEW ALL USERS IN DATABASE BY ROLE
-- =====================================================

-- 1. COUNT USERS BY ROLE
SELECT 
    r.role_name,
    COUNT(u.user_id) as total_users
FROM users u
JOIN roles r ON u.role_id = r.role_id
GROUP BY r.role_name
ORDER BY r.role_name;

-- =====================================================
-- 2. ALL STUDENTS
-- =====================================================
SELECT 
    u.user_id,
    u.username,
    u.email,
    u.full_name,
    s.student_number,
    s.grade_level,
    s.section,
    s.gender,
    s.birth_date,
    u.is_active,
    u.created_at
FROM users u
LEFT JOIN students s ON u.user_id = s.user_id
WHERE u.role_id = (SELECT role_id FROM roles WHERE role_name = 'student')
ORDER BY u.full_name ASC;

-- =====================================================
-- 3. ALL ADVISERS/FACULTY
-- =====================================================
SELECT 
    u.user_id,
    u.username,
    u.email,
    u.full_name,
    a.adviser_id,
    a.department,
    a.specialization,
    u.is_active,
    u.created_at
FROM users u
LEFT JOIN advisers a ON u.user_id = a.user_id
WHERE u.role_id = (SELECT role_id FROM roles WHERE role_name = 'adviser')
ORDER BY u.full_name ASC;

-- =====================================================
-- 4. ALL CLINIC STAFF
-- =====================================================
SELECT 
    u.user_id,
    u.username,
    u.email,
    u.full_name,
    cs.clinic_staff_id,
    cs.position,
    cs.department,
    cs.phone_number,
    u.is_active,
    u.created_at
FROM users u
LEFT JOIN clinic_staff cs ON u.user_id = cs.user_id
WHERE u.role_id = (SELECT role_id FROM roles WHERE role_name = 'clinic_staff')
ORDER BY u.full_name ASC;

-- =====================================================
-- 5. ACTIVE vs INACTIVE USERS
-- =====================================================
SELECT 
    r.role_name,
    u.is_active,
    COUNT(u.user_id) as count
FROM users u
JOIN roles r ON u.role_id = r.role_id
WHERE r.role_name IN ('student', 'adviser', 'clinic_staff')
GROUP BY r.role_name, u.is_active
ORDER BY r.role_name, u.is_active DESC;

-- =====================================================
-- 6. SUMMARY STATISTICS
-- =====================================================
SELECT 
    'Total Students' as category,
    COUNT(*) as count
FROM users u
WHERE u.role_id = (SELECT role_id FROM roles WHERE role_name = 'student')
UNION ALL
SELECT 
    'Total Advisers' as category,
    COUNT(*) as count
FROM users u
WHERE u.role_id = (SELECT role_id FROM roles WHERE role_name = 'adviser')
UNION ALL
SELECT 
    'Total Clinic Staff' as category,
    COUNT(*) as count
FROM users u
WHERE u.role_id = (SELECT role_id FROM roles WHERE role_name = 'clinic_staff')
UNION ALL
SELECT 
    'GRAND TOTAL' as category,
    COUNT(*) as count
FROM users u
WHERE u.role_id IN (SELECT role_id FROM roles WHERE role_name IN ('student', 'adviser', 'clinic_staff'));
