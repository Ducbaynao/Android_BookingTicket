# Showtime Seats Database Setup Guide

## Overview
This document provides instructions for checking the showtime_seats table schema and populating it with seat data for your movie booking application.

## Problem Statement
The React Native API was failing and using demo seats because the `showtime_seats` table didn't have real data linking showtimes to available seats.

## Solution
Populate the showtime_seats table with a record for each (showtime, seat) pair, where each record tracks whether that specific seat is available for that specific showtime.

---

## Commands to Run

### 1. Check Showtime Seats Table Schema
```sql
DESCRIBE showtime_seats;
```

**Expected Columns:**
- `id`: Primary key (auto-increment)
- `showtime_id`: Foreign key to showtimes table
- `seat_id`: Foreign key to seats table
- `is_available`: Boolean/tinyint (1 = available, 0 = booked)
- `created_at`: Timestamp
- `updated_at`: Timestamp
- Unique constraint on (showtime_id, seat_id)

### 2. Check Seats Table Schema
```sql
DESCRIBE seats;
```

**Expected Columns:**
- `id`: Primary key
- `seat_number`: Integer (seat number in row)
- `row_letter`: Character (A, B, C, etc.)
- `seat_type`: Varchar (standard, premium, etc.)
- `theater_id`: Foreign key
- `created_at`: Timestamp
- `updated_at`: Timestamp

### 3. Check Existing Showtime Seats Records
```sql
SELECT * FROM showtime_seats LIMIT 10;
```

### 4. View Showtimes Needing Seat Population
```sql
SELECT 
    s.id as showtime_id,
    s.movie_id,
    s.theater_id,
    s.showtime,
    s.available_seats,
    s.total_seats
FROM showtimes s
WHERE DATE(s.showtime) >= '2026-04-08'
ORDER BY s.showtime
LIMIT 20;
```

### 5. Check How Many Seats Each Showtime Has
```sql
SELECT 
    COUNT(*) as total_seats,
    COUNT(DISTINCT theater_id) as theaters
FROM seats;
```

---

## Population Script

### Quick Population (All Seats for All Showtimes from 2026-04-08)
```sql
INSERT INTO showtime_seats (showtime_id, seat_id, is_available, created_at, updated_at)
SELECT 
    s.id as showtime_id,
    st.id as seat_id,
    1 as is_available,
    NOW() as created_at,
    NOW() as updated_at
FROM showtimes s
CROSS JOIN seats st
WHERE DATE(s.showtime) >= '2026-04-08'
AND NOT EXISTS (
    SELECT 1 FROM showtime_seats ss 
    WHERE ss.showtime_id = s.id 
    AND ss.seat_id = st.id
)
ORDER BY s.id, st.id;
```

### Verification Query
```sql
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
```

### Sample Data Check
```sql
SELECT 
    s.showtime,
    st.seat_number,
    st.row_letter,
    st.seat_type,
    ss.is_available
FROM showtime_seats ss
JOIN showtimes s ON ss.showtime_id = s.id
JOIN seats st ON ss.seat_id = st.id
WHERE DATE(s.showtime) >= '2026-04-08'
ORDER BY s.showtime, st.row_letter, st.seat_number
LIMIT 25;
```

---

## Expected Results

### Before Population
- showtime_seats table may be empty or have partial data
- React Native API calls fail when trying to get available seats
- API falls back to demo seats

### After Population
- Each showtime has 100+ seat records (one per available seat)
- Each record shows seat availability (available = 1)
- React Native API can return real seat IDs:
  - Format: `A1`, `A2`, `B1`, etc. (row letter + seat number)
  - Theater-specific seat types included

---

## Implementation in React Native API

Once showtimes_seats is populated, your API endpoint can return real seat data:

```javascript
// Example API response structure
{
  "showtime_id": 123,
  "available_seats": [
    {
      "seat_id": 1,
      "row_letter": "A",
      "seat_number": 1,
      "seat_type": "standard",
      "seat_display": "A1"
    },
    {
      "seat_id": 2,
      "row_letter": "A",
      "seat_number": 2,
      "seat_type": "standard",
      "seat_display": "A2"
    }
    // ... more seats
  ],
  "total_available": 98,
  "total_seats": 100,
  "booked_seats": 2
}
```

---

## Performance Considerations

### Large Inserts
- If you have many showtimes (100+), the CROSS JOIN will create 100+ records per showtime
- Total records: `number_of_showtimes * number_of_seats_per_theater`
- Example: 50 showtimes × 100 seats = 5,000 records

### Optimization Tips
1. Disable foreign key checks during bulk insert (already done in script)
2. Use `IGNORE` or `NOT EXISTS` to avoid duplicates
3. Create indexes on (showtime_id, seat_id) if not already present
4. Consider batching large inserts (e.g., 10,000 records at a time)

---

## Troubleshooting

### Error: "Duplicate entry for key 'unique_showtime_seat'"
- Solution: Add `AND NOT EXISTS` clause to check for existing records
- Or use: `INSERT IGNORE INTO showtime_seats ...`

### Error: "Foreign key constraint fails"
- Check that showtime_id and seat_id exist in parent tables
- Verify the date range (2026-04-08) has showtimes

### No records returned
- Verify showtimes exist: `SELECT COUNT(*) FROM showtimes WHERE showtime >= '2026-04-08';`
- Verify seats exist: `SELECT COUNT(*) FROM seats;`
- Check both have data before running population

---

## Files Included

1. `database_schema_check.sql` - Queries to inspect current state
2. `populate_showtime_seats.sql` - Complete population script
3. This guide document

---

## Next Steps

1. Run `database_schema_check.sql` to understand current state
2. Review the schema and verify expectations
3. Run `populate_showtime_seats.sql` to populate seats
4. Verify with provided verification queries
5. Test React Native API endpoint to confirm it returns seat data
6. Update API to use real seat IDs instead of demo seats
