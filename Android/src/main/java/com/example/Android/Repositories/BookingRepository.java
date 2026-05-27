package com.example.Android.Repositories;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.Android.Models.Booking;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUserId(Long userId);
    
    List<Booking> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Booking> findByUserIdOrderByCreatedAtAsc(Long userId);

    List<Booking> findByStatusAndCreatedAtBefore(String status, LocalDateTime time);
    
    @Query("SELECT b FROM Booking b WHERE b.user.id = :userId AND b.status = :status ORDER BY b.createdAt DESC")
    List<Booking> findByUserIdAndStatus(@Param("userId") Long userId, @Param("status") String status);
    
    @Query("SELECT b FROM Booking b WHERE b.showtime.id = :showtimeId")
    List<Booking> findByShowtimeId(@Param("showtimeId") Long showtimeId);

    @Query("SELECT COALESCE(SUM(b.totalAmount), 0) FROM Booking b WHERE UPPER(b.status) = 'CONFIRMED'")
    Double sumConfirmedRevenue();

    @Query("""
            SELECT COALESCE(SUM(b.totalAmount), 0)
            FROM Booking b
            WHERE UPPER(b.status) = 'CONFIRMED'
              AND b.createdAt >= :start
              AND b.createdAt <= :end
            """)
    Double sumConfirmedRevenueBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("""
            SELECT COUNT(b)
            FROM Booking b
            WHERE b.createdAt >= :start
              AND b.createdAt <= :end
            """)
    long countByCreatedAtBetweenInclusive(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
