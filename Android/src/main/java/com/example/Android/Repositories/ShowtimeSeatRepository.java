package com.example.Android.Repositories;

import java.util.List;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.Android.Models.ShowtimeSeat;

@Repository
public interface ShowtimeSeatRepository extends JpaRepository<ShowtimeSeat, Long> {
    List<ShowtimeSeat> findByShowtimeId(Long showtimeId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT ss FROM ShowtimeSeat ss WHERE ss.id IN :ids")
    List<ShowtimeSeat> findAllByIdForUpdate(@Param("ids") List<Long> ids);
    
    @Query("SELECT ss FROM ShowtimeSeat ss WHERE ss.showtime.id = :showtimeId AND ss.status = 'available'")
    List<ShowtimeSeat> findAvailableSeatsByShowtimeId(@Param("showtimeId") Long showtimeId);
    
    @Query("SELECT COUNT(ss) FROM ShowtimeSeat ss WHERE ss.showtime.id = :showtimeId AND ss.status = 'available'")
    Long countAvailableSeatsByShowtimeId(@Param("showtimeId") Long showtimeId);
    
    @Query("SELECT ss FROM ShowtimeSeat ss WHERE ss.showtime.id = :showtimeId AND ss.seat.id IN :seatIds")
    List<ShowtimeSeat> findByShowtimeIdAndSeatIds(@Param("showtimeId") Long showtimeId, @Param("seatIds") List<Long> seatIds);

    boolean existsByShowtimeId(Long showtimeId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM ShowtimeSeat ss WHERE ss.showtime.id = :showtimeId")
    int deleteByShowtimeId(@Param("showtimeId") Long showtimeId);
}
