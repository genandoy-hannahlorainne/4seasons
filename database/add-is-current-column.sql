-- Add is_current column to school_years table
-- This column marks which school year is currently active

-- Check if column exists, if not add it
SET @dbname = DATABASE();
SET @tablename = 'school_years';
SET @columnname = 'is_current';

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE (table_name = @tablename)
   AND (table_schema = @dbname)
   AND (column_name = @columnname)) > 0,
  'SELECT ''Column already exists'' AS message',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' TINYINT(1) DEFAULT 0 COMMENT ''1 = Current school year, 0 = Not current'' AFTER is_active')
));

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Set the most recent school year as current if none is set
UPDATE school_years 
SET is_current = 1 
WHERE id = (
    SELECT id FROM (
        SELECT id FROM school_years 
        WHERE is_active = 1 
        ORDER BY start_date DESC 
        LIMIT 1
    ) AS temp
)
AND (SELECT COUNT(*) FROM school_years WHERE is_current = 1) = 0;

-- Verify the change
SELECT 
    id,
    year_name,
    start_date,
    end_date,
    is_active,
    is_current,
    CASE 
        WHEN is_current = 1 THEN '★ CURRENT'
        ELSE ''
    END AS status
FROM school_years
ORDER BY start_date DESC;
