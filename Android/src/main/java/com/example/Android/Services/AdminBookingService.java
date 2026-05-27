package com.example.Android.Services;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.Android.Models.Booking;
import com.example.Android.Models.BookingSeat;
import com.example.Android.Repositories.BookingRepository;
import com.example.Android.Repositories.BookingSeatRepository;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class AdminBookingService {
    
    BookingRepository bookingRepository;
    BookingSeatRepository bookingSeatRepository;
    ShowtimeSeatService showtimeSeatService;
    
    public List<Booking> getAllBookings(String status, Long userId, Long movieId, LocalDateTime startDate, LocalDateTime endDate) {
        log.info("Fetching all bookings with filters - status: {}, userId: {}, movieId: {}", status, userId, movieId);
        
        List<Booking> bookings = bookingRepository.findAll();
        
        // Apply status filter
        if (status != null && !status.isEmpty()) {
            bookings = bookings.stream()
                    .filter(b -> b.getStatus().equalsIgnoreCase(status))
                    .collect(Collectors.toList());
        }
        
        // Apply user filter
        if (userId != null) {
            bookings = bookings.stream()
                    .filter(b -> b.getUser() != null && b.getUser().getId().equals(userId))
                    .collect(Collectors.toList());
        }
        
        // Apply movie filter
        if (movieId != null) {
            bookings = bookings.stream()
                    .filter(b -> b.getShowtime() != null
                            && b.getShowtime().getMovie() != null
                            && b.getShowtime().getMovie().getId().equals(movieId))
                    .collect(Collectors.toList());
        }
        
        // Apply date range filter
        if (startDate != null) {
            bookings = bookings.stream()
                    .filter(b -> b.getCreatedAt().isAfter(startDate) || b.getCreatedAt().isEqual(startDate))
                    .collect(Collectors.toList());
        }
        
        if (endDate != null) {
            bookings = bookings.stream()
                    .filter(b -> b.getCreatedAt().isBefore(endDate) || b.getCreatedAt().isEqual(endDate))
                    .collect(Collectors.toList());
        }
        
        log.info("Found {} bookings after filtering", bookings.size());
        return bookings;
    }
    
    public Booking getBookingById(Long id) {
        log.info("Fetching booking with ID: {}", id);
        return bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found with ID: " + id));
    }
    
    @Transactional
    public Booking cancelBooking(Long id) {
        log.info("Canceling booking {}", id);
        
        Booking booking = getBookingById(id);
        
        if (booking.getStatus().equalsIgnoreCase("cancelled")) {
            throw new RuntimeException("Booking is already cancelled");
        }
        
        booking.setStatus("cancelled");
        for (BookingSeat bookingSeat : booking.getBookingSeats()) {
            showtimeSeatService.releaseSeat(bookingSeat.getShowtimeSeat().getId());
        }
        bookingSeatRepository.deleteByBookingId(booking.getId());
        booking.getBookingSeats().clear();
        Booking updatedBooking = bookingRepository.save(booking);
        
        log.info("Booking cancelled successfully: {}", id);
        return updatedBooking;
    }
}
