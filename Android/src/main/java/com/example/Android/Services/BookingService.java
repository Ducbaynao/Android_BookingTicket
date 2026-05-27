package com.example.Android.Services;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.Android.Models.Booking;
import com.example.Android.Models.BookingCombo;
import com.example.Android.Models.BookingSeat;
import com.example.Android.Models.Combo;
import com.example.Android.Models.ShowtimeSeat;
import com.example.Android.Models.User;
import com.example.Android.Models.Showtime;
import com.example.Android.DTO.Requests.CreateBookingRequest.ComboSelection;
import com.example.Android.Repositories.BookingComboRepository;
import com.example.Android.Repositories.BookingRepository;
import com.example.Android.Repositories.ShowtimeSeatRepository;
import com.example.Android.Repositories.UserRepository;
import com.example.Android.Repositories.ShowtimeRepository;
import com.example.Android.Repositories.BookingSeatRepository;
import com.example.Android.Repositories.ComboRepository;

@Service
public class BookingService {
    
    @Autowired
    private BookingRepository bookingRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ShowtimeRepository showtimeRepository;
    
    @Autowired
    private ShowtimeSeatRepository showtimeSeatRepository;
    
    @Autowired
    private ShowtimeSeatService showtimeSeatService;

    @Autowired
    private BookingSeatRepository bookingSeatRepository;

    @Autowired
    private ComboRepository comboRepository;

    @Autowired
    private BookingComboRepository bookingComboRepository;

    @Value("${booking.hold-timeout-minutes:15}")
    private long holdTimeoutMinutes;
    
    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }
    
    public Booking getBookingById(Long id) {
        return bookingRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Booking not found with id: " + id));
    }
    
    @Transactional(readOnly = true)
    public List<Booking> getMyBookings(Long userId) {
        List<Booking> bookings = bookingRepository.findByUserIdOrderByCreatedAtDesc(userId);
        
        // Force load nested entities to avoid LazyInitializationException
        for (Booking booking : bookings) {
            // Force load showtime and related entities
            if (booking.getShowtime() != null) {
                booking.getShowtime().getMovie().getTitle(); // Force load movie
                booking.getShowtime().getRoom().getCinema().getName(); // Force load room & cinema
            }
            
            // Force load booking seats and seat details
            for (BookingSeat bs : booking.getBookingSeats()) {
                if (bs.getShowtimeSeat() != null && bs.getShowtimeSeat().getSeat() != null) {
                    bs.getShowtimeSeat().getSeat().getSeatRow(); // Force load seat details
                }
            }

            for (BookingCombo bc : booking.getBookingCombos()) {
                if (bc.getCombo() != null) {
                    bc.getCombo().getName();
                }
            }
        }
        
        return bookings;
    }
    
    public List<Booking> getBookingsByStatus(Long userId, String status) {
        return bookingRepository.findByUserIdAndStatus(userId, status);
    }
    
    @Transactional
    public Booking createBooking(Long userId, Long showtimeId, List<Long> showtimeSeatIds, Double totalAmount) {
        return createBooking(userId, showtimeId, showtimeSeatIds, totalAmount, List.of());
    }

    @Transactional
    public Booking createBooking(Long userId, Long showtimeId, List<Long> showtimeSeatIds, Double totalAmount, List<ComboSelection> combos) {
        if (showtimeSeatIds == null || showtimeSeatIds.isEmpty()) {
            throw new RuntimeException("No seats selected");
        }

        // Validate user
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        // Validate showtime
        Showtime showtime = showtimeRepository.findById(showtimeId)
            .orElseThrow(() -> new RuntimeException("Showtime not found with id: " + showtimeId));

        Set<Long> uniqueSeatIdSet = new LinkedHashSet<>(showtimeSeatIds);
        List<Long> uniqueShowtimeSeatIds = List.copyOf(uniqueSeatIdSet);
        List<ShowtimeSeat> seats = showtimeSeatRepository.findAllByIdForUpdate(uniqueShowtimeSeatIds);
        if (seats.size() != uniqueShowtimeSeatIds.size()) {
            throw new RuntimeException("One or more selected seats are invalid");
        }
        
        // Validate seats are available
        for (ShowtimeSeat seat : seats) {
            LocalDateTime staleCutoff = LocalDateTime.now().minusMinutes(holdTimeoutMinutes);
            bookingSeatRepository.purgeStaleByShowtimeSeatId(seat.getId(), staleCutoff);
            if (!seat.isAvailable()) {
                throw new RuntimeException("Seat " + seat.getSeat().getFullSeatNumber() + " is not available");
            }
            bookingSeatRepository.findByShowtimeSeatId(seat.getId()).ifPresent(existingBookingSeat -> {
                Booking existingBooking = existingBookingSeat.getBooking();
                if (existingBooking == null) {
                    bookingSeatRepository.deleteByShowtimeSeatId(seat.getId());
                    return;
                }

                String existingStatus = existingBooking.getStatus();
                if ("PENDING_PAYMENT".equalsIgnoreCase(existingStatus)) {
                    LocalDateTime expiryTime = existingBooking.getCreatedAt().plusMinutes(holdTimeoutMinutes);
                    if (expiryTime.isBefore(LocalDateTime.now())) {
                        existingBooking.setStatus("EXPIRED");
                        bookingRepository.save(existingBooking);
                        bookingSeatRepository.deleteByBookingId(existingBooking.getId());
                    } else {
                        throw new RuntimeException("Seat " + seat.getSeat().getFullSeatNumber() + " is not available");
                    }
                } else if ("FAILED".equalsIgnoreCase(existingStatus)
                        || "EXPIRED".equalsIgnoreCase(existingStatus)
                        || "CANCELLED".equalsIgnoreCase(existingStatus)
                        || "cancelled".equalsIgnoreCase(existingStatus)) {
                    bookingSeatRepository.deleteByBookingId(existingBooking.getId());
                } else if ("CONFIRMED".equalsIgnoreCase(existingStatus)) {
                    seat.setStatus("booked");
                    showtimeSeatRepository.save(seat);
                    throw new RuntimeException("Seat " + seat.getSeat().getFullSeatNumber() + " is not available");
                } else {
                    throw new RuntimeException("Seat " + seat.getSeat().getFullSeatNumber() + " is not available");
                }
            });
        }

        List<ComboSelection> normalizedCombos = combos == null ? List.of() : combos.stream()
            .filter(selection -> selection != null && selection.getComboId() != null && selection.getQuantity() != null && selection.getQuantity() > 0)
            .toList();

        Map<Long, Combo> comboById = normalizedCombos.isEmpty()
            ? Map.of()
            : comboRepository.findAllById(
                    normalizedCombos.stream()
                        .map(ComboSelection::getComboId)
                        .collect(Collectors.toSet())
                ).stream().collect(Collectors.toMap(Combo::getId, combo -> combo));

        if (!normalizedCombos.isEmpty() && comboById.size() != normalizedCombos.stream().map(ComboSelection::getComboId).collect(Collectors.toSet()).size()) {
            throw new RuntimeException("Some selected combos are invalid");
        }

        double seatTotal = seats.stream().mapToDouble(ShowtimeSeat::getPrice).sum();
        double comboTotal = normalizedCombos.stream()
            .mapToDouble(selection -> {
                Combo combo = comboById.get(selection.getComboId());
                return combo == null ? 0 : combo.getComboPrice() * selection.getQuantity();
            })
            .sum();

        double subtotal = seatTotal + comboTotal;
        double expectedTotal = Math.round((subtotal + (subtotal * 0.05) + (subtotal * 0.08)) * 100.0) / 100.0;
        double receivedTotal = Math.round((totalAmount == null ? 0 : totalAmount) * 100.0) / 100.0;
        if (receivedTotal + 1.0d < expectedTotal) {
            throw new RuntimeException("Invalid total amount");
        }
        
        // Create booking with PENDING_PAYMENT status
        Booking booking = Booking.builder()
            .user(user)
            .showtime(showtime)
            .totalAmount(totalAmount)
            .status("PENDING_PAYMENT")  // Fixed: Changed from "confirmed" to "PENDING_PAYMENT"
            .build();
        
        booking = bookingRepository.save(booking);
        
        // Create booking seats
        for (ShowtimeSeat showtimeSeat : seats) {
            BookingSeat bookingSeat = BookingSeat.builder()
                .booking(booking)
                .showtimeSeat(showtimeSeat)
                .price(showtimeSeat.getPrice())
                .build();
            
            booking.getBookingSeats().add(bookingSeat);
            
            // Mark seat as HELD (temporary lock until payment confirmed)
            showtimeSeatService.markSeatAsHeld(showtimeSeat.getId());
        }

        for (ComboSelection selection : normalizedCombos) {
            Combo combo = comboById.get(selection.getComboId());
            BookingCombo bookingCombo = BookingCombo.builder()
                .booking(booking)
                .combo(combo)
                .quantity(selection.getQuantity())
                .totalPrice(combo.getComboPrice() * selection.getQuantity())
                .build();

            booking.getBookingCombos().add(bookingCombo);
        }

        bookingComboRepository.saveAll(booking.getBookingCombos());
        
        return bookingRepository.save(booking);
    }
    
    @Transactional
    public Booking cancelBooking(Long bookingId, Long userId) {
        Booking booking = getBookingById(bookingId);
        
        // Verify booking belongs to user
        if (!booking.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized: This booking does not belong to the user");
        }
        
        // Check if booking can be cancelled (e.g., showtime hasn't started)
        if (booking.getShowtime().getStartTime().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Cannot cancel booking: Showtime has already started");
        }
        
        // Update booking status
        booking.setStatus("cancelled");
        
        // Release seats
        for (BookingSeat bookingSeat : booking.getBookingSeats()) {
            showtimeSeatService.releaseSeat(bookingSeat.getShowtimeSeat().getId());
        }
        bookingSeatRepository.deleteByBookingId(booking.getId());
        booking.getBookingSeats().clear();
        
        return bookingRepository.save(booking);
    }
    
    public Double calculateTotalAmount(List<Long> showtimeSeatIds) {
        List<ShowtimeSeat> seats = showtimeSeatRepository.findAllById(showtimeSeatIds);
        return seats.stream()
            .mapToDouble(ShowtimeSeat::getPrice)
            .sum();
    }
}
