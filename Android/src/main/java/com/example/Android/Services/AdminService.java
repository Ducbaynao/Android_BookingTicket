package com.example.Android.Services;

import com.example.Android.Models.Booking;
import com.example.Android.Models.Movie;
import com.example.Android.Models.User;
import com.example.Android.Repositories.BookingRepository;
import com.example.Android.Repositories.MovieRepository;
import com.example.Android.Repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
/**
 * Admin Dashboard Service
 * Chứa logic tổng hợp dữ liệu thống kê cho dashboard admin.
 */
public class AdminService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserStatsService userStatsService;

    /**
     * Tổng hợp KPI dashboard:
     * totalRevenue, todayRevenue, totalBookings, monthlyBookings, activeUsers, totalMovies.
     */
    public Map<String, Object> getDashboardStatistics() {
        Map<String, Object> stats = new HashMap<>();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfDay = now.toLocalDate().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1).minusNanos(1);
        LocalDateTime startOfMonth = now.toLocalDate().withDayOfMonth(1).atStartOfDay();

        Double totalRevenue = bookingRepository.sumConfirmedRevenue();
        long totalBookings = bookingRepository.count();
        long activeUsers = userRepository.countActiveUsers();

        // Total movies
        long totalMovies = movieRepository.count();

        Double todayRevenue = bookingRepository.sumConfirmedRevenueBetween(startOfDay, endOfDay);
        long monthlyBookings = bookingRepository.countByCreatedAtBetweenInclusive(startOfMonth, now);

        stats.put("totalRevenue", totalRevenue);
        stats.put("todayRevenue", todayRevenue);
        stats.put("totalBookings", totalBookings);
        stats.put("monthlyBookings", monthlyBookings);
        stats.put("activeUsers", activeUsers);
        stats.put("totalUsers", activeUsers);
        stats.put("totalMovies", totalMovies);

        return stats;
    }

    /**
     * Tính thống kê doanh thu theo khoảng thời gian.
     * Nếu không truyền start/end thì mặc định lấy 30 ngày gần nhất.
     */
    public Map<String, Object> getRevenueStatistics(String startDateStr, String endDateStr) {
        Map<String, Object> stats = new HashMap<>();

        LocalDateTime startDate;
        LocalDateTime endDate;

        if (startDateStr != null && endDateStr != null) {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            startDate = LocalDate.parse(startDateStr, formatter).atStartOfDay();
            endDate = LocalDate.parse(endDateStr, formatter).atTime(23, 59, 59);
        } else {
            // Default: last 30 days
            endDate = LocalDateTime.now();
            startDate = endDate.minusDays(30);
        }

        List<Booking> bookingsInRange = bookingRepository.findAll().stream()
                .filter(b -> "CONFIRMED".equalsIgnoreCase(b.getStatus()))
                .filter(b -> !b.getCreatedAt().isBefore(startDate) && !b.getCreatedAt().isAfter(endDate))
                .collect(Collectors.toList());

        Double totalRevenue = bookingsInRange.stream()
                .mapToDouble(Booking::getTotalAmount)
                .sum();

        long totalBookings = bookingsInRange.size();

        // Group by date for chart data
        Map<String, Double> dailyRevenue = bookingsInRange.stream()
                .collect(Collectors.groupingBy(
                        b -> b.getCreatedAt().toLocalDate().toString(),
                        Collectors.summingDouble(Booking::getTotalAmount)
                ));

        long rangeHours = Math.max(1, Duration.between(startDate, endDate).toHours());
        int bucketHours;
        if (rangeHours <= 48) {
            bucketHours = 1;
        } else if (rangeHours <= 24 * 7) {
            bucketHours = 3;
        } else if (rangeHours <= 24 * 30) {
            bucketHours = 6;
        } else {
            bucketHours = 12;
        }

        LocalDateTime bucketStart = floorToBucket(startDate, bucketHours);
        LocalDateTime bucketEnd = floorToBucket(endDate, bucketHours);
        Map<LocalDateTime, Double> bucketRevenue = bookingsInRange.stream()
                .collect(Collectors.groupingBy(
                        b -> floorToBucket(b.getCreatedAt(), bucketHours),
                        Collectors.summingDouble(Booking::getTotalAmount)
                ));

        List<Map<String, Object>> timeSeries = new ArrayList<>();
        for (LocalDateTime cursor = bucketStart; !cursor.isAfter(bucketEnd); cursor = cursor.plusHours(bucketHours)) {
            Map<String, Object> point = new HashMap<>();
            point.put("timestamp", cursor.toString());
            point.put("revenue", bucketRevenue.getOrDefault(cursor, 0.0));
            timeSeries.add(point);
        }

        stats.put("totalRevenue", totalRevenue);
        stats.put("totalBookings", totalBookings);
        stats.put("dailyRevenue", dailyRevenue);
        stats.put("timeSeries", timeSeries);
        stats.put("bucketHours", bucketHours);
        stats.put("startDate", startDate.toString());
        stats.put("endDate", endDate.toString());

        return stats;
    }

    /**
     * Làm tròn thời gian về đầu bucket theo số giờ (1h/3h/6h/12h...).
     */
    private LocalDateTime floorToBucket(LocalDateTime dateTime, int bucketHours) {
        LocalDateTime truncated = dateTime.truncatedTo(ChronoUnit.HOURS);
        int hour = truncated.getHour();
        int flooredHour = (hour / bucketHours) * bucketHours;
        return truncated.withHour(flooredHour).withMinute(0).withSecond(0).withNano(0);
    }

    /**
     * Tính top phim theo số lượng booking, đồng thời tính doanh thu confirmed theo từng phim.
     */
    public List<Map<String, Object>> getTopMovies(int limit) {
        List<Booking> allBookings = bookingRepository.findAll();

        // Group bookings by movie and count
        Map<Long, Long> movieBookingCounts = allBookings.stream()
                .filter(b -> b.getShowtime() != null && b.getShowtime().getMovie() != null)
                .collect(Collectors.groupingBy(
                        b -> b.getShowtime().getMovie().getId(),
                        Collectors.counting()
                ));

        // Sort and get top movies
        List<Map<String, Object>> topMovies = movieBookingCounts.entrySet().stream()
                .sorted(Map.Entry.<Long, Long>comparingByValue().reversed())
                .limit(limit)
                .map(entry -> {
                    Map<String, Object> movieData = new HashMap<>();
                    Long movieId = entry.getKey();
                    Long bookingCount = entry.getValue();

                    Optional<Movie> movie = movieRepository.findById(movieId);
                    if (movie.isPresent()) {
                        Movie m = movie.get();
                        movieData.put("movieId", movieId);
                        movieData.put("title", m.getTitle());
                        movieData.put("posterUrl", m.getPosterUrl());
                        movieData.put("bookingCount", bookingCount);

                        // Calculate revenue for this movie
                        Double revenue = allBookings.stream()
                                .filter(b -> b.getShowtime() != null && 
                                           b.getShowtime().getMovie() != null && 
                                           b.getShowtime().getMovie().getId().equals(movieId))
                                .filter(b -> "CONFIRMED".equals(b.getStatus()))
                                .mapToDouble(Booking::getTotalAmount)
                                .sum();
                        movieData.put("revenue", revenue);
                    }

                    return movieData;
                })
                .collect(Collectors.toList());

        return topMovies;
    }

    /**
     * Lấy danh sách booking có phân trang cho endpoint dashboard legacy.
     */
    public Map<String, Object> getAllBookings(int page, int size) {
        Page<Booking> bookingPage = bookingRepository.findAll(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        );

        Map<String, Object> response = new HashMap<>();
        response.put("bookings", bookingPage.getContent());
        response.put("currentPage", bookingPage.getNumber());
        response.put("totalPages", bookingPage.getTotalPages());
        response.put("totalItems", bookingPage.getTotalElements());

        return response;
    }
}
