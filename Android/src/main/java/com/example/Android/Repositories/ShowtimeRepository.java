package com.example.Android.Repositories;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.Android.Models.Showtime;

@Repository
public interface ShowtimeRepository extends JpaRepository<Showtime, Long> {
    List<Showtime> findByMovieId(Long movieId);
    
    List<Showtime> findByRoomCinemaId(Long cinemaId);
    
    @Query("""
            SELECT s
            FROM Showtime s
            WHERE s.movie.id = :movieId
              AND s.startTime >= :startDate
              AND s.startTime < :endDate
            ORDER BY s.startTime ASC
            """)
    List<Showtime> findByMovieIdAndDateRange(
            @Param("movieId") Long movieId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
    
    @Query("SELECT s FROM Showtime s WHERE s.movie.id = :movieId AND s.room.cinema.id = :cinemaId")
    List<Showtime> findByMovieIdAndCinemaId(@Param("movieId") Long movieId, @Param("cinemaId") Long cinemaId);
    
    @Query("""
            SELECT s
            FROM Showtime s
            WHERE s.movie.id = :movieId
              AND s.room.cinema.id = :cinemaId
              AND s.startTime >= :startDate
              AND s.startTime < :endDate
            ORDER BY s.startTime ASC
            """)
    List<Showtime> findByMovieIdAndCinemaIdAndDateRange(
        @Param("movieId") Long movieId,
        @Param("cinemaId") Long cinemaId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
    
    @Query("SELECT s FROM Showtime s WHERE s.startTime >= :startDate AND s.startTime < :endDate")
    List<Showtime> findByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("""
            SELECT s
            FROM Showtime s
            WHERE s.room.cinema.id = :cinemaId
              AND s.startTime >= :startDate
              AND s.startTime < :endDate
            ORDER BY s.room.name ASC, s.startTime ASC
            """)
    List<Showtime> findByCinemaIdAndDateRange(
            @Param("cinemaId") Long cinemaId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
}
