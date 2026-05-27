package com.example.Android.Controllers;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.Android.DTO.Responses.BookingResponse;
import com.example.Android.Models.Booking;
import com.example.Android.Services.AdminBookingService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/admin/bookings")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class AdminBookingController {
    
    AdminBookingService adminBookingService;
    
    @GetMapping
    public ResponseEntity<List<BookingResponse>> getAllBookings(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long movieId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        log.info("Admin fetching bookings - status: {}, userId: {}, movieId: {}", status, userId, movieId);
        try {
            List<Booking> bookings = adminBookingService.getAllBookings(status, userId, movieId, startDate, endDate);
            List<BookingResponse> response = bookings.stream()
                    .map(this::convertToBookingResponse)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching bookings: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<BookingResponse> getBookingById(@PathVariable Long id) {
        log.info("Admin fetching booking with ID: {}", id);
        try {
            Booking booking = adminBookingService.getBookingById(id);
            return ResponseEntity.ok(convertToBookingResponse(booking));
        } catch (RuntimeException e) {
            log.error("Booking not found: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error fetching booking: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @PutMapping("/{id}/cancel")
    public ResponseEntity<BookingResponse> cancelBooking(@PathVariable Long id) {
        log.info("Admin canceling booking {}", id);
        try {
            Booking booking = adminBookingService.cancelBooking(id);
            return ResponseEntity.ok(convertToBookingResponse(booking));
        } catch (RuntimeException e) {
            log.error("Error canceling booking: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error canceling booking: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/stats")
    public ResponseEntity<?> getBookingStats() {
        log.info("Admin fetching booking statistics");
        try {
            // This can be expanded with statistics
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error fetching stats: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    private BookingResponse convertToBookingResponse(Booking booking) {
        Long userId = booking.getUser() != null ? booking.getUser().getId() : null;
        String userName = booking.getUser() != null && booking.getUser().getName() != null
                ? booking.getUser().getName()
                : booking.getUserNameSnapshot();
        String userEmail = booking.getUser() != null && booking.getUser().getEmail() != null
                ? booking.getUser().getEmail()
                : booking.getUserEmailSnapshot();

        Long showtimeId = null;
        String movieTitle = "Unknown movie";
        String cinemaName = "Unknown cinema";
        String roomName = "Unknown room";
        LocalDateTime showtimeStart = null;

        if (booking.getShowtime() != null) {
            showtimeId = booking.getShowtime().getId();
            showtimeStart = booking.getShowtime().getStartTime();
            if (booking.getShowtime().getMovie() != null && booking.getShowtime().getMovie().getTitle() != null) {
                movieTitle = booking.getShowtime().getMovie().getTitle();
            }
            if (booking.getShowtime().getRoom() != null) {
                if (booking.getShowtime().getRoom().getName() != null) {
                    roomName = booking.getShowtime().getRoom().getName();
                }
                if (booking.getShowtime().getRoom().getCinema() != null
                        && booking.getShowtime().getRoom().getCinema().getName() != null) {
                    cinemaName = booking.getShowtime().getRoom().getCinema().getName();
                }
            }
        }

        return BookingResponse.builder()
                .id(booking.getId())
                .userId(userId)
                .userName(userName)
                .userEmail(userEmail)
                .showtimeId(showtimeId)
                .movieTitle(movieTitle)
                .cinemaName(cinemaName)
                .roomName(roomName)
                .showtime(showtimeStart)
                .totalAmount(booking.getTotalAmount())
                .status(booking.getStatus())
                .createdAt(booking.getCreatedAt())
                .seatCount(booking.getBookingSeats() != null ? booking.getBookingSeats().size() : 0)
                .build();
    }
}
