package com.example.Android.Controllers;

import java.time.LocalDate;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.Android.Models.Showtime;
import com.example.Android.Services.ShowtimeService;

@RestController
@RequestMapping("/api/showtimes")
@CrossOrigin(origins = "*")
/**
 * Showtime Controller
 * Cung cấp API cho chức năng quản lí suất chiếu và tra cứu suất chiếu.
 */
public class ShowtimeController {
    
    @Autowired
    private ShowtimeService showtimeService;
    
    /**
     * API: GET /api/showtimes
     * Lấy danh sách suất chiếu với các tổ hợp lọc movieId/cinemaId/date.
     */
    @GetMapping
    public ResponseEntity<List<Showtime>> getShowtimes(
            @RequestParam(required = false) Long movieId,
            @RequestParam(required = false) Long cinemaId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        
        if (movieId != null && cinemaId != null && date != null) {
            return ResponseEntity.ok(showtimeService.getShowtimesByMovieAndCinemaAndDate(movieId, cinemaId, date));
        } else if (movieId == null && cinemaId != null && date != null) {
            return ResponseEntity.ok(showtimeService.getShowtimesByCinemaAndDate(cinemaId, date));
        } else if (movieId != null && date != null) {
            return ResponseEntity.ok(showtimeService.getShowtimesByMovieAndDate(movieId, date));
        } else if (movieId != null && cinemaId != null) {
            return ResponseEntity.ok(showtimeService.getShowtimesByMovieAndCinema(movieId, cinemaId));
        } else if (movieId != null) {
            return ResponseEntity.ok(showtimeService.getShowtimesByMovie(movieId));
        } else if (cinemaId != null) {
            return ResponseEntity.ok(showtimeService.getShowtimesByCinema(cinemaId));
        } else {
            return ResponseEntity.ok(showtimeService.getAllShowtimes());
        }
    }
    
    /**
     * API: GET /api/showtimes/{id}
     * Lấy chi tiết suất chiếu theo ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Showtime> getShowtimeById(@PathVariable Long id) {
        return ResponseEntity.ok(showtimeService.getShowtimeById(id));
    }
    
    /**
     * API: POST /api/showtimes
     * Tạo suất chiếu mới.
     */
    @PostMapping
    public ResponseEntity<Showtime> createShowtime(@RequestBody Showtime showtime) {
        try {
            return ResponseEntity.ok(showtimeService.createShowtime(showtime));
        } catch (RuntimeException ex) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }
    
    /**
     * API: PUT /api/showtimes/{id}
     * Cập nhật suất chiếu theo ID.
     */
    @PutMapping("/{id}")
    public ResponseEntity<Showtime> updateShowtime(@PathVariable Long id, @RequestBody Showtime showtime) {
        try {
            return ResponseEntity.ok(showtimeService.updateShowtime(id, showtime));
        } catch (RuntimeException ex) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }
    
    /**
     * API: DELETE /api/showtimes/{id}
     * Xóa suất chiếu theo ID.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteShowtime(@PathVariable Long id) {
        showtimeService.deleteShowtime(id);
        return ResponseEntity.noContent().build();
    }
}
