-- ============================================================================
-- Movie Booking Database: Schema Check and Showtime Seats Population
-- ============================================================================

-- Step 1: Check the showtime_seats table schema
DESCRIBE showtime_seats;

-- Step 2: Check the seats table schema
DESCRIBE seats;

-- Step 3: Check seats table structure in detail
SHOW FULL COLUMNS FROM seats;

-- Step 4: Check showtime_seats table structure in detail
SHOW FULL COLUMNS FROM showtime_seats;

-- Step 5: Display a few existing showtime_seats records if any exist
SELECT * FROM showtime_seats LIMIT 10;

-- Step 6: Display seat count and structure
SELECT COUNT(*) as total_seats FROM seats;
SELECT * FROM seats LIMIT 10;

-- Step 7: Display showtimes that need seats populated (from 2026-04-08 onwards)
SELECT 
    s.id as showtime_id,
    s.movie_id,
    s.theater_id,
    s.showtime,
    s.available_seats,
    s.total_seats,
    s.created_at
FROM showtimes s
WHERE DATE(s.showtime) >= '2026-04-08'
ORDER BY s.showtime
LIMIT 20;

-- Step 8: Check if showtime_seats records already exist for these showtimes
SELECT 
    COUNT(*) as existing_showtime_seat_records,
    COUNT(DISTINCT ss.showtime_id) as showtimes_with_seats
FROM showtime_seats ss
JOIN showtimes s ON ss.showtime_id = s.id
WHERE DATE(s.showtime) >= '2026-04-08';
