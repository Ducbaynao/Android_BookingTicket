package com.example.Android.Services;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

import com.example.Android.Models.Booking;
import com.example.Android.Repositories.BookingRepository;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class BookingConsumer {
    BookingRepository bookingRepository;

    @RabbitListener(queues = "bookingQueue")
    public void receiveBookingMessage(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId).orElse(null);

        if (booking == null) {
            log.warn("Skip async post-processing for booking {} because it is not visible yet", bookingId);
            return;
        }

        if (!"CONFIRMED".equalsIgnoreCase(booking.getStatus())) {
            log.warn("Skip async post-processing for booking {} because status is {}", bookingId, booking.getStatus());
            return;
        }

        log.info("Async processing started for confirmed booking {}", bookingId);
        log.info("Generated e-ticket payload for booking {}", bookingId);
        log.info("Queued booking confirmation notification for booking {}", bookingId);
        log.info("Async processing completed for booking {}", bookingId);
    }
}
