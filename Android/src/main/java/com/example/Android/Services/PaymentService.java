package com.example.Android.Services;

import com.example.Android.Models.Booking;
import com.example.Android.Models.BookingSeat;
import com.example.Android.Models.Payment;
import com.example.Android.Models.ShowtimeSeat;
import com.example.Android.Repositories.BookingRepository;
import com.example.Android.Repositories.BookingSeatRepository;
import com.example.Android.Repositories.PaymentRepository;
import com.example.Android.Repositories.ShowtimeSeatRepository;
import com.example.Android.Utils.VnpayUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class PaymentService {
    VnpayUtils vnpayUtils;
    BookingRepository bookingRepository;
    PaymentRepository paymentRepository;
    BookingSeatRepository bookingSeatRepository;
    ShowtimeSeatRepository showtimeSeatRepository;
    BookingProducer bookingProducer;
    RecommendationService recommendationService;

    @Transactional
    public String createPaymentUrl(Long bookingId, HttpServletRequest request) throws Exception {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!"PENDING_PAYMENT".equalsIgnoreCase(booking.getStatus())) {
            throw new RuntimeException("Booking is not eligible for payment");
        }

        Payment payment = paymentRepository.findByBookingId(bookingId)
                .orElse(Payment.builder()
                        .booking(booking)
                        .amount(booking.getTotalAmount())
                        .method("VNPAY")
                        .status("INIT")
                        .build());

        payment.setAmount(booking.getTotalAmount());
        payment.setMethod("VNPAY");
        if (!"SUCCESS".equalsIgnoreCase(payment.getStatus())) {
            payment.setStatus("INIT");
        }
        paymentRepository.save(payment);

        long amount = booking.getTotalAmount().longValue();
        return vnpayUtils.createPaymentUrl(amount, bookingId, request);
    }

    @Transactional
    public ResponseEntity<Map<String, String>> handleVnpIpn(Map<String, String> params) {
        try {
            if (!vnpayUtils.isValidSignature(params)) {
                return ResponseEntity.ok(ipnResponse("97", "Invalid Signature"));
            }

            String bookingRef = params.get("vnp_TxnRef");
            String amountRaw = params.get("vnp_Amount");
            String responseCode = params.getOrDefault("vnp_ResponseCode", "");
            String transactionStatus = params.getOrDefault("vnp_TransactionStatus", "");

            if (bookingRef == null || bookingRef.isBlank()) {
                return ResponseEntity.ok(ipnResponse("01", "Order not found"));
            }

            Long bookingId;
            try {
                bookingId = Long.valueOf(bookingRef);
            } catch (NumberFormatException ex) {
                return ResponseEntity.ok(ipnResponse("01", "Order not found"));
            }

            Booking booking = bookingRepository.findById(bookingId).orElse(null);
            if (booking == null) {
                return ResponseEntity.ok(ipnResponse("01", "Order not found"));
            }

            long expectedAmount = booking.getTotalAmount().longValue() * 100;
            long paidAmount;
            try {
                paidAmount = Long.parseLong(amountRaw);
            } catch (Exception ex) {
                return ResponseEntity.ok(ipnResponse("04", "Invalid amount"));
            }

            if (expectedAmount != paidAmount) {
                return ResponseEntity.ok(ipnResponse("04", "Invalid amount"));
            }

            Payment payment = paymentRepository.findByBookingId(bookingId)
                    .orElse(Payment.builder()
                            .booking(booking)
                            .amount(booking.getTotalAmount())
                            .method("VNPAY")
                            .status("INIT")
                            .build());

            if ("SUCCESS".equalsIgnoreCase(payment.getStatus()) || "CONFIRMED".equalsIgnoreCase(booking.getStatus())) {
                return ResponseEntity.ok(ipnResponse("02", "Order already confirmed"));
            }

            boolean success = "00".equals(responseCode)
                    && (transactionStatus.isBlank() || "00".equals(transactionStatus));

            List<BookingSeat> bookingSeats = bookingSeatRepository.findByBookingId(bookingId);
            List<ShowtimeSeat> showtimeSeats = bookingSeats.stream().map(BookingSeat::getShowtimeSeat).toList();

            if (success) {
                payment.setStatus("SUCCESS");
                payment.setPaidAt(LocalDateTime.now());
                paymentRepository.save(payment);

                booking.setStatus("CONFIRMED");
                bookingRepository.save(booking);
                recommendationService.saveBookingInteraction(booking);

                showtimeSeats.forEach(seat -> seat.setStatus("BOOKED"));
                showtimeSeatRepository.saveAll(showtimeSeats);

                publishBookingMessageAfterCommit(bookingId);
            } else {
                payment.setStatus("FAILED");
                paymentRepository.save(payment);

                booking.setStatus("FAILED");
                bookingRepository.save(booking);

                showtimeSeats.forEach(seat -> seat.setStatus("AVAILABLE"));
                showtimeSeatRepository.saveAll(showtimeSeats);
                bookingSeatRepository.deleteByBookingId(bookingId);
            }

            return ResponseEntity.ok(ipnResponse("00", "Confirm Success"));
        } catch (Exception ex) {
            log.error("VNPAY IPN error: {}", ex.getMessage(), ex);
            return ResponseEntity.ok(ipnResponse("99", "Unknown error"));
        }
    }

    @Transactional
    public void handleVnpReturn(Map<String, String> params) throws Exception {
        if (!vnpayUtils.isValidSignature(params)) {
            log.warn("Invalid signature on VNPay return");
            return;
        }

        String bookingRef = params.get("vnp_TxnRef");
        String responseCode = params.getOrDefault("vnp_ResponseCode", "");
        String transactionStatus = params.getOrDefault("vnp_TransactionStatus", "");

        if (bookingRef == null || bookingRef.isBlank()) {
            log.warn("No booking reference in VNPay return");
            return;
        }

        Long bookingId = Long.valueOf(bookingRef);
        Booking booking = bookingRepository.findById(bookingId).orElse(null);
        if (booking == null) {
            log.warn("Booking {} not found", bookingId);
            return;
        }

        // Don't reprocess if already confirmed
        if ("CONFIRMED".equalsIgnoreCase(booking.getStatus())) {
            log.info("Booking {} already confirmed", bookingId);
            return;
        }

        Payment payment = paymentRepository.findByBookingId(bookingId)
                .orElse(Payment.builder()
                        .booking(booking)
                        .amount(booking.getTotalAmount())
                        .method("VNPAY")
                        .status("INIT")
                        .build());

        boolean success = "00".equals(responseCode)
                && (transactionStatus.isBlank() || "00".equals(transactionStatus));

        List<BookingSeat> bookingSeats = bookingSeatRepository.findByBookingId(bookingId);
        List<ShowtimeSeat> showtimeSeats = bookingSeats.stream().map(BookingSeat::getShowtimeSeat).toList();

        if (success) {
            payment.setStatus("SUCCESS");
            payment.setPaidAt(LocalDateTime.now());
            paymentRepository.save(payment);

            booking.setStatus("CONFIRMED");
            bookingRepository.save(booking);
            recommendationService.saveBookingInteraction(booking);

            showtimeSeats.forEach(seat -> seat.setStatus("BOOKED"));
            showtimeSeatRepository.saveAll(showtimeSeats);

            publishBookingMessageAfterCommit(bookingId);
            log.info("Booking {} confirmed via VNPay return", bookingId);
        } else {
            payment.setStatus("FAILED");
            paymentRepository.save(payment);

            booking.setStatus("FAILED");
            bookingRepository.save(booking);

            showtimeSeats.forEach(seat -> seat.setStatus("AVAILABLE"));
            showtimeSeatRepository.saveAll(showtimeSeats);
            bookingSeatRepository.deleteByBookingId(bookingId);
            log.info("Booking {} failed via VNPay return", bookingId);
        }
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getPaymentStatus(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        Payment payment = paymentRepository.findByBookingId(bookingId).orElse(null);

        String paymentStatus = payment == null ? "INIT" : payment.getStatus();

        Map<String, Object> result = new HashMap<>();
        result.put("bookingId", bookingId);
        result.put("bookingStatus", booking.getStatus());
        result.put("paymentStatus", paymentStatus);
        result.put("isFinal", "SUCCESS".equalsIgnoreCase(paymentStatus) || "FAILED".equalsIgnoreCase(paymentStatus));
        result.put("isSuccess", "SUCCESS".equalsIgnoreCase(paymentStatus) && "CONFIRMED".equalsIgnoreCase(booking.getStatus()));
        result.put("paidAt", payment == null ? null : payment.getPaidAt());

        return result;
    }

    @Transactional(readOnly = true)
    public boolean isValidReturnSignature(Map<String, String> params) {
        try {
            return vnpayUtils.isValidSignature(params);
        } catch (Exception ex) {
            return false;
        }
    }

    private Map<String, String> ipnResponse(String code, String message) {
        Map<String, String> response = new HashMap<>();
        response.put("RspCode", code);
        response.put("Message", message);
        return response;
    }

    private void publishBookingMessageAfterCommit(Long bookingId) {
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    sendBookingMessageSafely(bookingId);
                }
            });
            return;
        }

        sendBookingMessageSafely(bookingId);
    }

    private void sendBookingMessageSafely(Long bookingId) {
        try {
            bookingProducer.sendBookingMessage(bookingId);
        } catch (Exception ex) {
            log.warn("Booking {} confirmed but async publish failed: {}", bookingId, ex.getMessage());
        }
    }

    @Transactional
    public void manuallyConfirmBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found: " + bookingId));

        if ("CONFIRMED".equalsIgnoreCase(booking.getStatus())) {
            log.info("Booking {} already confirmed", bookingId);
            return;
        }

        Payment payment = paymentRepository.findByBookingId(bookingId)
                .orElse(Payment.builder()
                        .booking(booking)
                        .amount(booking.getTotalAmount())
                        .method("VNPAY")
                        .status("INIT")
                        .build());

        payment.setStatus("SUCCESS");
        payment.setPaidAt(LocalDateTime.now());
        paymentRepository.save(payment);

        booking.setStatus("CONFIRMED");
        bookingRepository.save(booking);
        recommendationService.saveBookingInteraction(booking);

        List<BookingSeat> bookingSeats = bookingSeatRepository.findByBookingId(bookingId);
        List<ShowtimeSeat> showtimeSeats = bookingSeats.stream().map(BookingSeat::getShowtimeSeat).toList();
        showtimeSeats.forEach(seat -> seat.setStatus("BOOKED"));
        showtimeSeatRepository.saveAll(showtimeSeats);

        publishBookingMessageAfterCommit(bookingId);

        log.info("Manually confirmed booking {}", bookingId);
    }
}
