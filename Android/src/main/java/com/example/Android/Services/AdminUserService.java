package com.example.Android.Services;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.Android.Models.Booking;
import com.example.Android.Models.DeletedUserArchive;
import com.example.Android.Models.User;
import com.example.Android.Repositories.BookingRepository;
import com.example.Android.Repositories.DeletedUserArchiveRepository;
import com.example.Android.Repositories.MovieRecommendationRepository;
import com.example.Android.Repositories.UserGenrePreferenceRepository;
import com.example.Android.Repositories.UserMovieInteractionRepository;
import com.example.Android.Repositories.UserRepository;
import com.example.Android.Repositories.WatchHistoryRepository;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
/**
 * Admin User Service
 * Chứa nghiệp vụ cho chức năng quản lí người dùng.
 */
public class AdminUserService {
    
    UserRepository userRepository;
    BookingRepository bookingRepository;
    DeletedUserArchiveRepository deletedUserArchiveRepository;
    UserStatsService userStatsService;
    WatchHistoryRepository watchHistoryRepository;
    UserMovieInteractionRepository userMovieInteractionRepository;
    MovieRecommendationRepository movieRecommendationRepository;
    UserGenrePreferenceRepository userGenrePreferenceRepository;
    private static final Set<String> ALLOWED_TIERS = Set.of("BRONZE", "SILVER", "GOLD");
    
    /**
     * Lấy danh sách user với bộ lọc:
     * - search theo name/email
     * - role
     * - status
     * - loyalty tier
     */
    public List<User> getAllUsers(String search, String role, String status, String loyaltyTier) {
        log.info("Fetching all users with filters - search: {}, role: {}, status: {}, loyaltyTier: {}",
                search, role, status, loyaltyTier);

        String normalizedSearch = search != null ? search.trim().toLowerCase() : "";
        String normalizedRole = role != null ? role.trim().toUpperCase() : "";
        String normalizedStatus = status != null ? status.trim().toUpperCase() : "";
        String normalizedTier = loyaltyTier != null ? loyaltyTier.trim().toUpperCase() : "";

        if (!normalizedTier.isEmpty() && !ALLOWED_TIERS.contains(normalizedTier)) {
            throw new IllegalArgumentException("Invalid loyalty tier. Must be BRONZE, SILVER or GOLD");
        }

        List<User> users = userRepository.findAll();
        
        // Apply search filter
        if (!normalizedSearch.isEmpty()) {
            users = users.stream()
                    .filter(u -> (u.getName() != null && u.getName().toLowerCase().contains(normalizedSearch))
                            || (u.getEmail() != null && u.getEmail().toLowerCase().contains(normalizedSearch)))
                    .collect(Collectors.toList());
        }
        
        // Apply role filter
        if (!normalizedRole.isEmpty()) {
            users = users.stream()
                    .filter(u -> normalizedRole.equalsIgnoreCase(u.getRole()))
                    .collect(Collectors.toList());
        }
        
        // Apply status filter
        if (!normalizedStatus.isEmpty()) {
            users = users.stream()
                    .filter(u -> normalizedStatus.equalsIgnoreCase(u.getStatus()))
                    .collect(Collectors.toList());
        }

        // Apply loyalty tier filter
        if (!normalizedTier.isEmpty()) {
            users = users.stream()
                    .filter(u -> u.getLoyaltyTier() != null && normalizedTier.equalsIgnoreCase(u.getLoyaltyTier()))
                    .collect(Collectors.toList());
        }
        
        log.info("Found {} users after filtering", users.size());
        return users;
    }
    
    /**
     * Lấy user theo ID, throw exception nếu không tồn tại.
     */
    public User getUserById(Long id) {
        log.info("Fetching user with ID: {}", id);
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + id));
    }
    
    /**
     * Cập nhật role cho user (USER/ADMIN).
     */
    public User updateUserRole(Long id, String role) {
        log.info("Updating role for user {}: {}", id, role);
        
        // Validate role
        if (!role.equals("USER") && !role.equals("ADMIN")) {
            throw new RuntimeException("Invalid role. Must be USER or ADMIN");
        }
        
        User user = getUserById(id);
        user.setRole(role);
        User updatedUser = userRepository.save(user);
        
        log.info("User role updated successfully: {} -> {}", id, role);
        return updatedUser;
    }
    
    /**
     * Cập nhật trạng thái user (ACTIVE/BLOCKED).
     */
    public User updateUserStatus(Long id, String status) {
        log.info("Updating status for user {}: {}", id, status);
        
        // Validate status
        if (!status.equals("ACTIVE") && !status.equals("BLOCKED")) {
            throw new RuntimeException("Invalid status. Must be ACTIVE or BLOCKED");
        }
        
        User user = getUserById(id);
        user.setStatus(status);
        User updatedUser = userRepository.save(user);
        
        log.info("User status updated successfully: {} -> {}", id, status);
        return updatedUser;
    }

    /**
     * Xóa user và preserve lịch sử:
     * - Lưu archive vào deleted_users_archive
     * - Snapshot thông tin user vào booking
     * - Xóa dữ liệu tương tác/gợi ý liên quan
     * - Cập nhật thống kê user active
     */
    @Transactional
    public void deleteUserAndPreserveHistory(Long id) {
        User user = getUserById(id);
        boolean wasActive = "ACTIVE".equalsIgnoreCase(user.getStatus());

        deletedUserArchiveRepository.save(DeletedUserArchive.builder()
                .originalUserId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .status(user.getStatus())
                .totalSpending(user.getTotalSpending())
                .loyaltyPoints(user.getLoyaltyPoints())
                .loyaltyTier(user.getLoyaltyTier())
                .createdAt(user.getCreatedAt())
                .deletedAt(java.time.LocalDateTime.now())
                .build());

        List<Booking> userBookings = bookingRepository.findByUserIdOrderByCreatedAtAsc(user.getId());
        for (Booking booking : userBookings) {
            booking.setUserNameSnapshot(user.getName());
            booking.setUserEmailSnapshot(user.getEmail());
            booking.setUser(null);
        }
        bookingRepository.saveAll(userBookings);

        movieRecommendationRepository.deleteByUser(user);
        userMovieInteractionRepository.deleteByUser(user);
        watchHistoryRepository.deleteByUser(user);
        userGenrePreferenceRepository.deleteByUser(user);

        userRepository.delete(user);
        userStatsService.onUserDeleted(wasActive);
    }
}
