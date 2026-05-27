package com.example.Android.Services;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.Android.Models.Booking;
import com.example.Android.Models.BookingSeat;
import com.example.Android.Models.Payment;
import com.example.Android.Models.ShowtimeSeat;
import com.example.Android.Repositories.BookingRepository;
import com.example.Android.Repositories.BookingSeatRepository;
import com.example.Android.Repositories.PaymentRepository;
import com.example.Android.Repositories.ShowtimeSeatRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class BookingExpirationService {

    BookingRepository bookingRepository;
    BookingSeatRepository bookingSeatRepository;
    ShowtimeSeatRepository showtimeSeatRepository;
    PaymentRepository paymentRepository;

    @NonFinal
    @Value("${booking.hold-timeout-minutes:7}")
    long holdTimeoutMinutes;

    @Scheduled(fixedDelayString = "${booking.expiration-check-interval-ms:60000}")
    @Transactional
    public void releaseExpiredBookings() {
        LocalDateTime cutoffTime = LocalDateTime.now().minusMinutes(holdTimeoutMinutes);
        List<Booking> expiredBookings = bookingRepository.findByStatusAndCreatedAtBefore("PENDING_PAYMENT", cutoffTime);

        if (expiredBookings.isEmpty()) {
            return;
        }

        for (Booking booking : expiredBookings) {
            List<BookingSeat> bookingSeats = bookingSeatRepository.findByBookingId(booking.getId());
            List<ShowtimeSeat> showtimeSeats = bookingSeats.stream()
                    .map(BookingSeat::getShowtimeSeat)
                    .toList();

            showtimeSeats.forEach(seat -> {
                if ("HELD".equalsIgnoreCase(seat.getStatus())) {
                    seat.setStatus("AVAILABLE");
                }
            });
            showtimeSeatRepository.saveAll(showtimeSeats);
            bookingSeatRepository.deleteByBookingId(booking.getId());

            paymentRepository.findByBookingId(booking.getId()).ifPresent(payment -> markPaymentExpired(payment));

            booking.setStatus("EXPIRED");
            bookingRepository.save(booking);
        }

        log.info("Released {} expired pending bookings", expiredBookings.size());
    }

    private void markPaymentExpired(Payment payment) {
        if ("INIT".equalsIgnoreCase(payment.getStatus())) {
            payment.setStatus("FAILED");
            paymentRepository.save(payment);
        }
    }
}
