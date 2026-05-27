package com.example.Android.Controllers;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import com.example.Android.DTO.Responses.UserResponse;
import com.example.Android.DTO.Responses.BookingResponse;
import com.example.Android.Models.Booking;
import com.example.Android.Models.User;
import com.example.Android.Services.AdminBookingService;
import com.example.Android.Services.AdminUserService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
/**
 * Admin User Controller
 * Cung cấp API cho chức năng quản lí người dùng phía admin.
 */
public class AdminUserController {
    
    AdminUserService adminUserService;
    AdminBookingService adminBookingService;
    
    /**
     * API: GET /api/admin/users
     * Lấy danh sách user theo bộ lọc tìm kiếm/quyền/trạng thái/tier.
     */
    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String loyaltyTier) {
        log.info("Admin fetching users - search: {}, role: {}, status: {}, loyaltyTier: {}",
                search, role, status, loyaltyTier);
        try {
            List<User> users = adminUserService.getAllUsers(search, role, status, loyaltyTier);
            List<UserResponse> response = users.stream()
                    .map(this::convertToUserResponse)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid users filter: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error fetching users: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * API: GET /api/admin/users/{id}
     * Lấy thông tin chi tiết người dùng.
     */
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        log.info("Admin fetching user with ID: {}", id);
        try {
            User user = adminUserService.getUserById(id);
            return ResponseEntity.ok(convertToUserResponse(user));
        } catch (RuntimeException e) {
            log.error("User not found: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error fetching user: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * API: PUT /api/admin/users/{id}/role?role=...
     * Cập nhật role người dùng; chặn admin tự đổi role của chính mình.
     */
    @PutMapping("/{id}/role")
    public ResponseEntity<UserResponse> updateUserRole(
             @PathVariable Long id, 
            @RequestParam String role,
            Authentication authentication) {
        log.info("Admin updating role for user {}: {}", id, role);
        try {
            if (authentication == null || authentication.getName() == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            User targetUser = adminUserService.getUserById(id);
            if (authentication != null
                    && authentication.getName() != null
                    && targetUser.getEmail() != null
                    && targetUser.getEmail().equalsIgnoreCase(authentication.getName())) {
                log.warn("Admin self role update blocked for user {}", id);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            User user = adminUserService.updateUserRole(id, role);
            return ResponseEntity.ok(convertToUserResponse(user));
        } catch (RuntimeException e) {
            log.error("Error updating role: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error updating role: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * API: PUT /api/admin/users/{id}/status?status=...
     * Cập nhật trạng thái user; chặn admin tự khóa chính mình.
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<UserResponse> updateUserStatus(
             @PathVariable Long id, 
            @RequestParam String status,
            Authentication authentication) {
        log.info("Admin updating status for user {}: {}", id, status);
        try {
            if (authentication == null || authentication.getName() == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            User targetUser = adminUserService.getUserById(id);
            if (authentication != null
                    && authentication.getName() != null
                    && targetUser.getEmail() != null
                    && targetUser.getEmail().equalsIgnoreCase(authentication.getName())) {
                log.warn("Admin self status update blocked for user {}", id);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            User user = adminUserService.updateUserStatus(id, status);
            return ResponseEntity.ok(convertToUserResponse(user));
        } catch (RuntimeException e) {
            log.error("Error updating status: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error updating status: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * API: DELETE /api/admin/users/{id}
     * Xóa user và giữ dữ liệu lịch sử cần thiết để đối soát.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            if (authentication == null || authentication.getName() == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            User targetUser = adminUserService.getUserById(id);
            if (targetUser.getEmail() != null
                    && targetUser.getEmail().equalsIgnoreCase(authentication.getName())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            adminUserService.deleteUserAndPreserveHistory(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Error deleting user: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error deleting user: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * API: GET /api/admin/users/{id}/bookings
     * Lấy lịch sử booking của một user (có thể lọc theo trạng thái).
     */
    @GetMapping("/{id}/bookings")
    @Transactional(readOnly = true)
    public ResponseEntity<List<BookingResponse>> getUserBookings(
            @PathVariable Long id,
            @RequestParam(required = false) String status) {
        log.info("Admin fetching bookings for user {} with status {}", id, status);
        try {
            List<Booking> bookings = adminBookingService.getAllBookings(status, id, null, null, null);
            List<BookingResponse> response = bookings.stream()
                    .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                    .map(this::convertToBookingResponse)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching user bookings: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Chuyển entity User sang UserResponse cho API response chuẩn.
     */
    private UserResponse convertToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .totalSpending(user.getTotalSpending())
                .loyaltyPoints(user.getLoyaltyPoints())
                .loyaltyTier(user.getLoyaltyTier())
                .tierUpdatedAt(user.getTierUpdatedAt())
                .build();
    }

    /**
     * Chuyển entity Booking sang BookingResponse để hiển thị ở màn hình admin.
     */
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
        java.time.LocalDateTime showtimeStart = null;

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
