package com.example.Android.Controllers;

import com.example.Android.Models.Booking;
import com.example.Android.Models.User;
import com.example.Android.Services.BookingService;
import com.example.Android.Services.PaymentService;
import com.example.Android.Services.UserService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Map;

/**
 * Controller xử lý tất cả các yêu cầu liên quan đến thanh toán.
 * Tích hợp cổng thanh toán VNPay, hỗ trợ tạo URL thanh toán,
 * tiếp nhận callback (Return URL) và Webhook (IPN URL) từ VNPay.
 */
@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final PaymentService paymentService;
    private final BookingService bookingService;
    private final UserService userService;

    // URL deep link để điều hướng ngược lại ứng dụng di động sau khi thanh toán thành công
    @Value("${vnpay.APP_RETURN_URL:moviebooking://payment-result}")
    private String appReturnUrl;

    // Tên gói Android của ứng dụng di động phục vụ việc tạo Android Intent URL
    @Value("${vnpay.APP_ANDROID_PACKAGE:com.moviebookingmobile}")
    private String appAndroidPackage;

    /**
     * API tạo liên kết thanh toán VNPay cho một đơn đặt vé cụ thể.
     * 
     * @param bookingId ID của đơn đặt vé cần thanh toán.
     * @param request HttpServletRequest để lấy địa chỉ IP của client.
     * @return ResponseEntity chứa URL thanh toán VNPay (Sandbox).
     */
    @GetMapping("/pay")
    public ResponseEntity<?> createPayment(@RequestParam Long bookingId, HttpServletRequest request) {
        try {
            return ResponseEntity.status(202).body(paymentService.createPaymentUrl(bookingId, request));
        } catch (Exception e) {
            log.error("Create payment URL failed for booking {}: {}", bookingId, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Cannot create payment URL",
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * API Webhook (Instant Payment Notification - IPN) nhận kết quả thanh toán ẩn danh từ VNPay.
     * VNPay gọi API này trực tiếp từ máy chủ của họ để cập nhật trạng thái đơn hàng một cách bảo mật.
     * 
     * @param params Bản đồ chứa tất cả tham số phản hồi từ VNPay.
     * @return ResponseEntity trả về phản hồi chuẩn dạng JSON cho VNPay (ví dụ: RspCode=00).
     */
    @GetMapping("/vnpIpn")
    public ResponseEntity<Map<String, String>> vnpIpn(@RequestParam Map<String, String> params) {
        log.info("VNPAY IPN: {}", params);
        return paymentService.handleVnpIpn(params);
    }

    /**
     * API Return URL tiếp nhận phản hồi điều hướng của người dùng sau khi hoàn thành giao dịch trên VNPay.
     * Phân tích kết quả thanh toán, cập nhật trạng thái và xuất trang HTML tự động chuyển hướng về ứng dụng di động.
     * 
     * @param params Bản đồ chứa các tham số VNPay trả về trên URL.
     * @param request HttpServletRequest để kiểm tra thông tin trình duyệt User-Agent.
     * @return ResponseEntity dạng TEXT_HTML chứa giao diện thông báo kết quả và script chuyển hướng.
     */
    @GetMapping("/vnpReturn")
    public ResponseEntity<String> vnpReturn(@RequestParam Map<String, String> params, HttpServletRequest request) {
        log.info("VNPAY RETURN: {}", params);

        // Thực hiện xử lý nghiệp vụ thanh toán (idempotent) trước khi điều hướng về App di động
        try {
            paymentService.handleVnpReturn(params);
        } catch (Exception e) {
            log.error("Error processing VNPay return: {}", e.getMessage());
        }

        // Kiểm tra chữ ký bảo mật từ VNPay để đảm bảo dữ liệu không bị giả mạo
        boolean validSignature = paymentService.isValidReturnSignature(params);
        String bookingId = params.getOrDefault("vnp_TxnRef", "");
        String responseCode = params.getOrDefault("vnp_ResponseCode", "");
        String transactionStatus = params.getOrDefault("vnp_TransactionStatus", "");

        // Mã phản hồi "00" biểu thị giao dịch thành công tại cổng VNPay
        boolean gatewaySuccess = "00".equals(responseCode)
                && (transactionStatus.isBlank() || "00".equals(transactionStatus));
        boolean bookingConfirmed = false;

        // Truy vấn lại cơ sở dữ liệu để xác nhận trạng thái đơn đặt vé đã được chuyển thành CONFIRMED
        try {
            Long bookingIdLong = Long.valueOf(bookingId);
            Booking booking = bookingService.getBookingById(bookingIdLong);
            bookingConfirmed = "CONFIRMED".equalsIgnoreCase(booking.getStatus());
        } catch (Exception ex) {
            log.warn("Cannot verify booking {} status on VNPay return: {}", bookingId, ex.getMessage());
        }

        // Đơn hàng thanh toán thành công hoàn tất khi chữ ký hợp lệ, cổng báo thành công và DB đã xác nhận
        boolean isSuccess = validSignature && gatewaySuccess && bookingConfirmed;

        // Xây dựng Deep Link để truyền kết quả về ứng dụng di động React Native
        String appDeepLink = UriComponentsBuilder.fromUriString(appReturnUrl)
                .queryParam("bookingId", bookingId)
                .queryParam("vnp_ResponseCode", responseCode)
                .queryParam("vnp_TransactionStatus", transactionStatus)
                .queryParam("signatureValid", validSignature)
                .queryParam("webStatus", isSuccess ? "success" : "failed")
                .build(true)
                .toUriString();

        // Xây dựng Android Intent URL phục vụ việc mở lại App tự động trên môi trường Android Chrome
        String androidIntentUrl = UriComponentsBuilder
                .fromUriString("intent://payment-result")
                .queryParam("bookingId", bookingId)
                .queryParam("vnp_ResponseCode", responseCode)
                .queryParam("vnp_TransactionStatus", transactionStatus)
                .queryParam("signatureValid", validSignature)
                .queryParam("webStatus", isSuccess ? "success" : "failed")
                .build(true)
                .toUriString()
                + "#Intent;scheme=moviebooking;package=" + appAndroidPackage + ";end";

        String userAgent = request.getHeader("User-Agent");
        boolean isAndroidBrowser = userAgent != null && userAgent.toLowerCase().contains("android");
        String primaryOpenUrl = isAndroidBrowser ? androidIntentUrl : appDeepLink;

        String title = isSuccess ? "Thanh toán thành công!" : "Thanh toán chưa thành công";
        String message = isSuccess
                ? "Đơn hàng đã được xác nhận. Hệ thống sẽ chuyển bạn về ứng dụng để xem vé."
                : "Không thể xác nhận thanh toán. Hệ thống sẽ chuyển bạn về ứng dụng để kiểm tra trạng thái vé.";

        // Trả về trang HTML thông báo kết quả giao dịch vô cùng chuyên nghiệp và tự động mở deep link
        String html = """
                <!doctype html>
                <html lang="vi">
                <head>
                  <meta charset="UTF-8" />
                  <meta name="viewport" content="width=device-width, initial-scale=1" />
                  <title>%s</title>
                  <style>
                    body { font-family: Arial, sans-serif; background:#f7f7f8; margin:0; padding:24px; }
                    .card { max-width:520px; margin:48px auto; background:#fff; border-radius:12px; padding:24px; box-shadow:0 8px 20px rgba(0,0,0,.08); }
                    .ok { color:#0f9d58; } .fail { color:#d93025; }
                    .btn { display:inline-block; margin-top:14px; background:#111827; color:#fff; padding:10px 14px; border-radius:8px; text-decoration:none; }
                  </style>
                </head>
                <body>
                  <div class="card">
                    <h2 class="%s">%s</h2>
                    <p>%s</p>
                    <p>Đang chuyển về ứng dụng sau <b>2 giây</b>...</p>
                    <a id="open-app-btn" class="btn" href="%s">Quay lại ứng dụng ngay</a>
                  </div>
                  <script>
                    const appDeepLink = %s;
                    const androidIntentUrl = %s;
                    const isAndroid = /Android/i.test(navigator.userAgent);
                    const primaryOpenUrl = %s;

                    function openAppNow() {
                      if (isAndroid) {
                        window.location.href = androidIntentUrl;
                        setTimeout(function () {
                          window.location.href = appDeepLink;
                        }, 400);
                        return;
                      }
                      window.location.href = appDeepLink;
                    }

                    const openAppBtn = document.getElementById('open-app-btn');
                    if (openAppBtn) {
                      openAppBtn.addEventListener('click', function () {
                        openAppNow();
                      });
                    }

                    setTimeout(function () {
                      window.location.href = primaryOpenUrl;
                    }, 2000);
                  </script>
                </body>
                </html>
                """.formatted(
                title,
                isSuccess ? "ok" : "fail",
                title,
                message,
                primaryOpenUrl,
                toJsStringLiteral(appDeepLink),
                toJsStringLiteral(androidIntentUrl),
                toJsStringLiteral(primaryOpenUrl)
        );

        return ResponseEntity
                .status(HttpStatus.OK)
                .contentType(MediaType.TEXT_HTML)
                .body(html);
    }

    /**
     * API kiểm tra trạng thái thanh toán hiện tại của một đơn đặt vé.
     * Yêu cầu xác thực người dùng và đảm bảo người dùng chỉ xem được trạng thái đơn hàng của chính mình.
     * 
     * @param bookingId ID của đơn đặt vé.
     * @param authentication Đối tượng chứa thông tin người dùng đã xác thực.
     * @return ResponseEntity chứa trạng thái thanh toán và thông tin giao dịch chi tiết.
     */
    @GetMapping("/status")
    public ResponseEntity<?> getPaymentStatus(@RequestParam Long bookingId, Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
        }

        Booking booking = bookingService.getBookingById(bookingId);
        User currentUser = userService.findByEmail(authentication.getName());

        // Kiểm tra quyền sở hữu đơn hàng để tránh rò rỉ dữ liệu (Broken Object Level Authorization)
        if (booking.getUser() == null || !booking.getUser().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Forbidden"));
        }

        return ResponseEntity.ok(paymentService.getPaymentStatus(bookingId));
    }

    /**
     * API dành riêng cho quản trị viên (ADMIN) để kích hoạt thủ công kết quả thanh toán thành công.
     * Hỗ trợ quá trình kiểm thử lập trình (Testing/Debugging) mà không cần quét QR VNPay thực tế.
     * 
     * @param bookingId ID đơn đặt vé cần kích hoạt thủ công.
     * @return ResponseEntity thông báo kết quả kích hoạt.
     */
    @PostMapping("/admin/confirm/{bookingId}")
    public ResponseEntity<?> manuallyConfirmPayment(@PathVariable Long bookingId) {
        try {
            paymentService.manuallyConfirmBooking(bookingId);
            return ResponseEntity.ok(Map.of("message", "Booking confirmed successfully", "bookingId", bookingId));
        } catch (Exception e) {
            log.error("Error confirming booking: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Hàm phụ trợ chuyển đổi chuỗi Java thành ký tự an toàn khi chèn vào script JS của trang HTML.
     */
    private String toJsStringLiteral(String value) {
        return "'" + value.replace("\\", "\\\\").replace("'", "\\'") + "'";
    }
}
