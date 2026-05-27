package com.example.Android.Repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.Android.Models.BookingSeat;

@Repository
public interface BookingSeatRepository extends JpaRepository<BookingSeat, Long> {
    List<BookingSeat> findByBookingId(Long bookingId);

    Optional<BookingSeat> findByShowtimeSeatId(Long showtimeSeatId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM BookingSeat bs WHERE bs.booking.id = :bookingId")
    int deleteByBookingId(@Param("bookingId") Long bookingId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM BookingSeat bs WHERE bs.showtimeSeat.id = :showtimeSeatId")
    int deleteByShowtimeSeatId(@Param("showtimeSeatId") Long showtimeSeatId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        DELETE FROM BookingSeat bs
        WHERE bs.showtimeSeat.id = :showtimeSeatId
          AND (
              UPPER(bs.booking.status) IN ('FAILED', 'EXPIRED', 'CANCELLED')
              OR (
                  UPPER(bs.booking.status) IN ('PENDING_PAYMENT', 'PENDING')
                  AND bs.booking.createdAt < :cutoffTime
              )
          )
        """)
    int purgeStaleByShowtimeSeatId(@Param("showtimeSeatId") Long showtimeSeatId, @Param("cutoffTime") java.time.LocalDateTime cutoffTime);
}
