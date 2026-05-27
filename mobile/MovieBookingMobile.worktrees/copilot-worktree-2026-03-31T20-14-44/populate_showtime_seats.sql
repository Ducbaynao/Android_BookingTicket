-- ============================================================================
-- Populate showtime_seats for all showtimes from 2026-04-08 onwards
-- ============================================================================
-- This script creates seat availability records linking showtimes with seats
-- It assumes:
-- 1. seats table contains all available seats (usually 100 seats)
-- 2. showtime_seats links showtimes with seats and tracks availability
-- 3. Showtimes from 2026-04-08 need to be populated

-- Enable bulk insert for performance
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET FOREIGN_KEY_CHECKS = 0;

-- Step 1: Delete any existing records for showtimes we're about to populate
-- (optional - only if you want to refresh)
-- DELETE ss FROM showtime_seats ss
-- JOIN showtimes s ON ss.showtime_id = s.id
-- WHERE DATE(s.showtime) >= '2026-04-08';

-- Step 2: Insert showtime_seats records for all seats in each showtime
-- This creates N records per showtime (where N = number of seats)
INSERT INTO showtime_seats (showtime_id, seat_id, is_available, created_at, updated_at)
SELECT 
    s.id as showtime_id,
    st.id as seat_id,
    1 as is_available,  -- All seats available initially
    NOW() as created_at,
    NOW() as updated_at
FROM showtimes s
CROSS JOIN seats st
WHERE DATE(s.showtime) >= '2026-04-08'
AND NOT EXISTS (
    -- Avoid duplicates
    SELECT 1 FROM showtime_seats ss 
    WHERE ss.showtime_id = s.id 
    AND ss.seat_id = st.id
)
ORDER BY s.id, st.id;

-- Step 3: Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Step 4: Verify the population
SELECT 
    DATE(s.showtime) as showtime_date,
    COUNT(DISTINCT ss.showtime_id) as showtimes_populated,
    COUNT(DISTINCT ss.seat_id) as unique_seats,
    COUNT(*) as total_seat_records,
    SUM(CASE WHEN ss.is_available = 1 THEN 1 ELSE 0 END) as available_seats,
    SUM(CASE WHEN ss.is_available = 0 THEN 1 ELSE 0 END) as booked_seats
FROM showtime_seats ss
JOIN showtimes s ON ss.showtime_id = s.id
WHERE DATE(s.showtime) >= '2026-04-08'
GROUP BY DATE(s.showtime)
ORDER BY showtime_date;

-- Step 5: Show sample records
SELECT 
    s.showtime,
    st.seat_number,
    st.row_letter,
    st.seat_type,
    ss.is_available,
    ss.created_at
FROM showtime_seats ss
JOIN showtimes s ON ss.showtime_id = s.id
JOIN seats st ON ss.seat_id = st.id
WHERE DATE(s.showtime) >= '2026-04-08'
LIMIT 20;
