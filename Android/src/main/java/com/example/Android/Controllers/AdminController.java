package com.example.Android.Controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.example.Android.Services.AdminService;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
/**
 * Admin Dashboard Controller
 * Cung cấp API cho chức năng xem thống kê quản trị.
 */
public class AdminController {

    @Autowired
    private AdminService adminService;

    /**
     * API: GET /api/admin/dashboard/stats
     * Trả bộ chỉ số tổng quan dashboard: doanh thu, booking, user active, tổng phim...
     */
    @GetMapping("/dashboard/stats")
    // @PreAuthorize("hasRole('ADMIN')")  // Temporarily disabled for testing
    public ResponseEntity<?> getDashboardStats() {
        try {
            Map<String, Object> stats = adminService.getDashboardStatistics();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * API: GET /api/admin/dashboard/revenue
     * Trả dữ liệu doanh thu theo khoảng ngày để hiển thị biểu đồ.
     */
    @GetMapping("/dashboard/revenue")
    // @PreAuthorize("hasRole('ADMIN')")  // Temporarily disabled for testing
    public ResponseEntity<?> getRevenueStats(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        try {
            Map<String, Object> stats = adminService.getRevenueStatistics(startDate, endDate);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * API: GET /api/admin/dashboard/top-movies
     * Trả danh sách phim top theo số lượng booking.
     */
    @GetMapping("/dashboard/top-movies")
    // @PreAuthorize("hasRole('ADMIN')")  // Temporarily disabled for testing
    public ResponseEntity<?> getTopMovies(@RequestParam(defaultValue = "5") int limit) {
        try {
            return ResponseEntity.ok(adminService.getTopMovies(limit));
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * API: GET /api/admin/dashboard/bookings
     * Trả danh sách booking phân trang (endpoint legacy cho dashboard).
     */
    @GetMapping("/dashboard/bookings")
    // @PreAuthorize("hasRole('ADMIN')")  // Temporarily disabled for testing
    public ResponseEntity<?> getAllBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            return ResponseEntity.ok(adminService.getAllBookings(page, size));
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}
