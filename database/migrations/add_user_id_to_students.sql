-- Migration: Add user_id column to students table
-- Run this SQL script on your production database to fix the schema mismatch
-- 
-- Usage: mysql -u your_user -p your_database < database/migrations/add_user_id_to_students.sql
-- Or run directly in MySQL client

USE fee_management;

-- Check if column exists before adding (safe to run multiple times)
SET @col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'students' 
    AND COLUMN_NAME = 'user_id'
);

-- Add column if it doesn't exist
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE students 
     ADD COLUMN user_id INT NULL UNIQUE AFTER parent_id,
     ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
     ADD INDEX idx_user_id (user_id)',
    'SELECT "Column user_id already exists. Migration skipped." AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Migration completed successfully!' AS status;

