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

/**
 * Service xử lý nghiệp vụ thanh toán (Business Logic Layer).
 * Đảm nhận vai trò phối hợp giữa việc tạo giao dịch thanh toán, kiểm tra chữ ký số,
 * xử lý webhook/callback, cập nhật trạng thái đơn đặt vé và đồng bộ ghế ngồi thực tế,
 * tích hợp lưu lịch sử hành vi gợi ý và gửi tin nhắn RabbitMQ bất đồng bộ.
 */
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

    /**
     * Tạo URL cổng thanh toán VNPay Sandbox cho đơn đặt vé.
     * Đảm bảo cơ chế kiểm tra nghiệp vụ chặt chẽ (đơn hàng phải ở trạng thái PENDING_PAYMENT).
     * 
     * @param bookingId ID đơn đặt vé.
     * @param request Yêu cầu HTTP lấy IP phục vụ VNPay.
     * @return Chuỗi URL liên kết thanh toán sang Sandbox VNPay.
     * @throws Exception Các lỗi về bảo mật ký số hoặc không tìm thấy dữ liệu.
     */
    @Transactional
    public String createPaymentUrl(Long bookingId, HttpServletRequest request) throws Exception {
        // 1. Kiểm tra đơn đặt vé tồn tại trong cơ sở dữ liệu
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        // 2. Chỉ cho phép đơn hàng có trạng thái PENDING_PAYMENT thực hiện thanh toán
        if (!"PENDING_PAYMENT".equalsIgnoreCase(booking.getStatus())) {
            throw new RuntimeException("Booking is not eligible for payment");
        }

        // 3. Khởi tạo bản ghi thanh toán (Payment) mới hoặc tái sử dụng bản ghi cũ
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
            payment.setStatus("INIT"); // Thiết lập lại trạng thái khởi tạo giao dịch
        }
        paymentRepository.save(payment);

        // 4. Lấy số tiền giao dịch và gọi Utility chuyển đổi sang URL thanh toán VNPay
        long amount = booking.getTotalAmount().longValue();
        return vnpayUtils.createPaymentUrl(amount, bookingId, request);
    }

    /**
     * Xử lý Webhook IPN được gọi trực tiếp và ẩn danh từ VNPay.
     * Áp dụng tính chất Idempotency (Tránh xử lý trùng lặp giao dịch).
     * 
     * @param params Bộ tham số phản hồi từ VNPay.
     * @return ResponseEntity phản hồi cho VNPay báo đã nhận và xử lý xong IPN.
     */
    @Transactional
    public ResponseEntity<Map<String, String>> handleVnpIpn(Map<String, String> params) {
        try {
            // 1. Kiểm tra tính toàn vẹn và chữ ký bảo mật từ VNPay
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

            // 2. Tìm kiếm đơn hàng tương ứng trong cơ sở dữ liệu
            Booking booking = bookingRepository.findById(bookingId).orElse(null);
            if (booking == null) {
                return ResponseEntity.ok(ipnResponse("01", "Order not found"));
            }

            // 3. So khớp số tiền thanh toán (VNPay nhân 100 lần số tiền thực tế)
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

            // 4. Nếu đơn hàng đã được xác nhận thành công trước đó (Idempotency check)
            if ("SUCCESS".equalsIgnoreCase(payment.getStatus()) || "CONFIRMED".equalsIgnoreCase(booking.getStatus())) {
                return ResponseEntity.ok(ipnResponse("02", "Order already confirmed"));
            }

            // 5. Kiểm tra mã giao dịch thành công ("00")
            boolean success = "00".equals(responseCode)
                    && (transactionStatus.isBlank() || "00".equals(transactionStatus));

            List<BookingSeat> bookingSeats = bookingSeatRepository.findByBookingId(bookingId);
            List<ShowtimeSeat> showtimeSeats = bookingSeats.stream().map(BookingSeat::getShowtimeSeat).toList();

            if (success) {
                // Xử lý Giao dịch THÀNH CÔNG
                payment.setStatus("SUCCESS");
                payment.setPaidAt(LocalDateTime.now());
                paymentRepository.save(payment);

                // Cập nhật trạng thái đặt vé thành CONFIRMED
                booking.setStatus("CONFIRMED");
                bookingRepository.save(booking);
                
                // Lưu vết hành vi người dùng đặt vé để tối ưu hệ thống gợi ý phim (Interaction score = 5)
                recommendationService.saveBookingInteraction(booking);

                // Chuyển trạng thái ghế từ HELD sang BOOKED vĩnh viễn cho suất chiếu này
                showtimeSeats.forEach(seat -> seat.setStatus("BOOKED"));
                showtimeSeatRepository.saveAll(showtimeSeats);

                // Gửi thông báo sự kiện bất đồng bộ qua RabbitMQ sau khi Spring Transaction Commit thành công
                publishBookingMessageAfterCommit(bookingId);
            } else {
                // Xử lý Giao dịch THẤT BẠI
                payment.setStatus("FAILED");
                paymentRepository.save(payment);

                booking.setStatus("FAILED");
                bookingRepository.save(booking);

                // Rollback: Giải phóng ghế trở lại trạng thái AVAILABLE
                showtimeSeats.forEach(seat -> seat.setStatus("AVAILABLE"));
                showtimeSeatRepository.saveAll(showtimeSeats);
                
                // Xóa mối liên kết ghế đặt trong bảng trung gian để trống chỗ suất chiếu
                bookingSeatRepository.deleteByBookingId(bookingId);
            }

            return ResponseEntity.ok(ipnResponse("00", "Confirm Success"));
        } catch (Exception ex) {
            log.error("VNPAY IPN error: {}", ex.getMessage(), ex);
            return ResponseEntity.ok(ipnResponse("99", "Unknown error"));
        }
    }

    /**
     * Xử lý đồng bộ kết quả trả về tại URL callback vnpReturn.
     * Cung cấp trải nghiệm tức thời cho người dùng khi trình duyệt được điều hướng về hệ thống.
     * 
     * @param params Bộ các tham số VNPay đính kèm trên URL.
     */
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

        // Kiểm tra Idempotency để tránh ghi đè kết quả nếu IPN đã xử lý trước đó
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

    /**
     * Truy xuất trạng thái thanh toán nghiệp vụ của đơn đặt vé.
     * 
     * @param bookingId ID đơn đặt vé.
     * @return Bản đồ chứa thông tin chi tiết trạng thái để client phản hồi giao diện.
     */
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

    /**
     * Hàm phụ trợ kiểm tra tính hợp lệ chữ ký của phản hồi từ VNPay.
     */
    @Transactional(readOnly = true)
    public boolean isValidReturnSignature(Map<String, String> params) {
        try {
            return vnpayUtils.isValidSignature(params);
        } catch (Exception ex) {
            return false;
        }
    }

    /**
     * Tạo dữ liệu Map phản hồi chuẩn dành cho máy chủ VNPay khi giao dịch IPN.
     */
    private Map<String, String> ipnResponse(String code, String message) {
        Map<String, String> response = new HashMap<>();
        response.put("RspCode", code);
        response.put("Message", message);
        return response;
    }

    /**
     * Gửi tin nhắn chứa thông tin Booking đến hệ thống RabbitMQ để thực hiện hậu xử lý bất đồng bộ.
     * Đảm bảo tính nhất quán dữ liệu bằng cách chỉ phát tin nhắn SAU KHI Database Transaction hiện tại đã commit thành công.
     */
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

    /**
     * Hàm thực thi gửi tin nhắn an toàn, bọc try-catch tránh làm crash luồng thanh toán chính nếu RabbitMQ gặp sự cố.
     */
    private void sendBookingMessageSafely(Long bookingId) {
        try {
            bookingProducer.sendBookingMessage(bookingId);
        } catch (Exception ex) {
            log.warn("Booking {} confirmed but async publish failed: {}", bookingId, ex.getMessage());
        }
    }

    /**
     * Xác nhận đơn đặt vé thủ công (chức năng quản trị / giả lập thử nghiệm).
     * Thực hiện chốt trạng thái đơn hàng và chuyển ghế thành BOOKED không qua cổng VNPay.
     */
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
