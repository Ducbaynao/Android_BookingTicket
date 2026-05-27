-- Fix database issues for backend startup
USE movie_booking_db;

-- Disable safe update mode temporarily
SET SQL_SAFE_UPDATES = 0;

-- 1. Fix NULL full_name values
UPDATE users 
SET full_name = CASE 
  WHEN email IS NOT NULL THEN SUBSTRING_INDEX(email, '@', 1)
  ELSE 'User'
END 
WHERE full_name IS NULL OR full_name = '';

-- 2. Check duplicate admin accounts
SELECT id, email, full_name, role, created_at 
FROM users 
WHERE role = 'ADMIN';

-- 3. Keep only the first admin account, delete duplicates
DELETE u1 FROM users u1
INNER JOIN users u2 
WHERE u1.id > u2.id 
AND u1.role = 'ADMIN' 
AND u2.role = 'ADMIN';

-- 4. Verify results
SELECT 'Users with NULL full_name:' as check_type, COUNT(*) as count FROM users WHERE full_name IS NULL OR full_name = ''
UNION ALL
SELECT 'Admin accounts:', COUNT(*) FROM users WHERE role = 'ADMIN'
UNION ALL  
SELECT 'Total users:', COUNT(*) FROM users;

-- 5. Show admin account info
SELECT id, email, full_name, role, status, created_at 
FROM users 
WHERE role = 'ADMIN';

-- Re-enable safe update mode
SET SQL_SAFE_UPDATES = 1;