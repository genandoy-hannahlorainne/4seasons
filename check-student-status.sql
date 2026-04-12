-- Check SHDF status for student 136883100331
SELECT 
    s.student_id,
    s.first_name,
    s.last_name,
    sy.year_label as school_year,
    sy.is_current,
    ss.basic_completed,
    ss.basic_completed_at,
    ss.comprehensive_completed,
    ss.comprehensive_completed_at,
    ss.comprehensive_deadline
FROM students s
LEFT JOIN student_shdf_status ss ON s.student_id = ss.student_id
LEFT JOIN school_years sy ON ss.school_year_id = sy.id
WHERE s.student_id = 136883100331;

-- Check if there's a current school year
SELECT id, year_label, is_current FROM school_years WHERE is_current = 1;
