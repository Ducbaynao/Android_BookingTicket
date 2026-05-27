package com.example.Android.Controllers;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.example.Android.DTO.Requests.CreateBookingRequest;
import com.example.Android.Models.Booking;
import com.example.Android.Models.BookingCombo;
import com.example.Android.Models.BookingSeat;
import com.example.Android.Models.User;
import com.example.Android.Services.BookingService;
import com.example.Android.Services.UserService;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "*")
public class BookingController {
    
    @Autowired
    private BookingService bookingService;
    
    @Autowired
    private UserService userService;
    
    @GetMapping("/my")
    public ResponseEntity<List<Booking>> getMyBookings(Authentication authentication) {
        String email = authentication.getName();
        User user = userService.findByEmail(email);
        
        // DEBUG: Log request info
        System.out.println("=== GET MY BOOKINGS DEBUG ===");
        System.out.println("Email: " + email);
        System.out.println("User ID: " + user.getId());
        
        List<Booking> bookings = bookingService.getMyBookings(user.getId());
        System.out.println("Bookings count: " + bookings.size());
        
        if (!bookings.isEmpty()) {
            System.out.println("First booking ID: " + bookings.get(0).getId());
            System.out.println("First booking status: " + bookings.get(0).getStatus());
        }
        
        return ResponseEntity.ok(bookings);
    }
    
    @GetMapping("/my-simple")
    public ResponseEntity<List<Map<String, Object>>> getMyBookingsSimple(Authentication authentication) {
        String email = authentication.getName();
        User user = userService.findByEmail(email);
        
        System.out.println("=== GET MY BOOKINGS SIMPLE ===");
        System.out.println("Email: " + email);
        System.out.println("User ID: " + user.getId());
        
        List<Booking> bookings = bookingService.getMyBookings(user.getId());
        System.out.println("Raw bookings count: " + bookings.size());
        
        List<Map<String, Object>> result = bookings.stream().map(booking -> {
            Map<String, Object> bookingMap = new java.util.HashMap<>();
            bookingMap.put("id", booking.getId());
            bookingMap.put("totalAmount", booking.getTotalAmount());
            bookingMap.put("status", booking.getStatus());
            bookingMap.put("createdAt", booking.getCreatedAt());
            bookingMap.put("qrCode", booking.getQrCode());
            bookingMap.put("bookingDate", booking.getBookingDate());
            
            // Showtime info
            if (booking.getShowtime() != null) {
                Map<String, Object> showtimeMap = new java.util.HashMap<>();
                showtimeMap.put("id", booking.getShowtime().getId());
                showtimeMap.put("startTime", booking.getShowtime().getStartTime());
                showtimeMap.put("endTime", booking.getShowtime().getEndTime());
                
                // Movie info
                if (booking.getShowtime().getMovie() != null) {
                    Map<String, Object> movieMap = new java.util.HashMap<>();
                    movieMap.put("id", booking.getShowtime().getMovie().getId());
                    movieMap.put("title", booking.getShowtime().getMovie().getTitle());
                    movieMap.put("poster", booking.getShowtime().getMovie().getPosterUrl());
                    movieMap.put("duration", booking.getShowtime().getMovie().getDuration());
                    showtimeMap.put("movie", movieMap);
                }
                
                // Room info
                if (booking.getShowtime().getRoom() != null) {
                    Map<String, Object> roomMap = new java.util.HashMap<>();
                    roomMap.put("id", booking.getShowtime().getRoom().getId());
                    roomMap.put("name", booking.getShowtime().getRoom().getName());
                    
                    if (booking.getShowtime().getRoom().getCinema() != null) {
                        Map<String, Object> cinemaMap = new java.util.HashMap<>();
                        cinemaMap.put("id", booking.getShowtime().getRoom().getCinema().getId());
                        cinemaMap.put("name", booking.getShowtime().getRoom().getCinema().getName());
                        cinemaMap.put("address", booking.getShowtime().getRoom().getCinema().getAddress());
                        roomMap.put("cinema", cinemaMap);
                    }
                    showtimeMap.put("room", roomMap);
                }
                
                bookingMap.put("showtime", showtimeMap);
            }
            
            // Seat info
            List<Map<String, Object>> seatsList = new java.util.ArrayList<>();
            for (BookingSeat bs : booking.getBookingSeats()) {
                if (bs.getShowtimeSeat() != null && bs.getShowtimeSeat().getSeat() != null) {
                    Map<String, Object> seatMap = new java.util.HashMap<>();
                    seatMap.put("seatRow", bs.getShowtimeSeat().getSeat().getSeatRow());
                    seatMap.put("seatNumber", bs.getShowtimeSeat().getSeat().getSeatNumber());
                    seatMap.put("seatType", bs.getShowtimeSeat().getSeat().getSeatType());
                    seatsList.add(seatMap);
                }
            }
            bookingMap.put("seats", seatsList);

            List<Map<String, Object>> combosList = new java.util.ArrayList<>();
            for (BookingCombo bookingCombo : booking.getBookingCombos()) {
                if (bookingCombo.getCombo() != null) {
                    Map<String, Object> comboMap = new java.util.HashMap<>();
                    comboMap.put("comboId", bookingCombo.getCombo().getId());
                    comboMap.put("name", bookingCombo.getCombo().getName());
                    comboMap.put("quantity", bookingCombo.getQuantity());
                    comboMap.put("totalPrice", bookingCombo.getTotalPrice());
                    combosList.add(comboMap);
                }
            }
            bookingMap.put("combos", combosList);
             
            return bookingMap;
        }).toList();
        
        System.out.println("Final result count: " + result.size());
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Booking> getBookingById(@PathVariable Long id, Authentication authentication) {
        Booking booking = bookingService.getBookingById(id);
        
        // Verify booking belongs to authenticated user
        String email = authentication.getName();
        User user = userService.findByEmail(email);
        
        if (booking.getUser() == null || !booking.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).build();
        }
        
        return ResponseEntity.ok(booking);
    }
    
    @PostMapping
    public ResponseEntity<Map<String, Object>> createBooking(
            @RequestBody CreateBookingRequest bookingRequest,
            Authentication authentication) {
        return createBookingInternal(bookingRequest, authentication, false);
    }

    @PostMapping("/create-simple")
    public ResponseEntity<Map<String, Object>> createBookingSimple(
            @RequestBody CreateBookingRequest bookingRequest,
            Authentication authentication) {
        return createBookingInternal(bookingRequest, authentication, true);
    }

    private ResponseEntity<Map<String, Object>> createBookingInternal(
            CreateBookingRequest bookingRequest,
            Authentication authentication,
            boolean includeApiMarker) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        String email = authentication.getName();
        User user = userService.findByEmail(email);
        
        Long showtimeId = bookingRequest.getShowtimeId();
        List<Long> showtimeSeatIds = bookingRequest.getShowtimeSeatIds();
        Double totalAmount = bookingRequest.getTotalAmount();
        
        Booking booking = bookingService.createBooking(
                user.getId(),
                showtimeId,
                showtimeSeatIds,
                totalAmount,
                bookingRequest.getCombos());
        Map<String, Object> response = new java.util.HashMap<>();
        response.put("id", booking.getId());
        response.put("status", booking.getStatus());
        response.put("totalAmount", booking.getTotalAmount());
        response.put("createdAt", booking.getCreatedAt());
        if (includeApiMarker) {
            response.put("api", "booking-create-v2");
        }
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Booking> cancelBooking(@PathVariable Long id, Authentication authentication) {
        String email = authentication.getName();
        User user = userService.findByEmail(email);
        
        Booking booking = bookingService.cancelBooking(id, user.getId());
        return ResponseEntity.ok(booking);
    }
    
    @PostMapping("/calculate")
    public ResponseEntity<Map<String, Double>> calculateTotal(@RequestBody List<Long> showtimeSeatIds) {
        Double total = bookingService.calculateTotalAmount(showtimeSeatIds);
        return ResponseEntity.ok(Map.of("total", total));
    }
}
