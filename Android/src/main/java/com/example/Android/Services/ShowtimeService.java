package com.example.Android.Services;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.Android.Models.Seat;
import com.example.Android.Models.Showtime;
import com.example.Android.Models.ShowtimeSeat;
import com.example.Android.Repositories.SeatRepository;
import com.example.Android.Repositories.ShowtimeRepository;
import com.example.Android.Repositories.ShowtimeSeatRepository;

@Service
/**
 * Showtime Service
 * Chứa nghiệp vụ cho chức năng quản lí suất chiếu.
 */
public class ShowtimeService {
    
    @Autowired
    private ShowtimeRepository showtimeRepository;

    @Autowired
    private SeatRepository seatRepository;

    @Autowired
    private ShowtimeSeatRepository showtimeSeatRepository;
    
    /**
     * Lấy tất cả suất chiếu.
     */
    public List<Showtime> getAllShowtimes() {
        return showtimeRepository.findAll();
    }
    
    /**
     * Lấy chi tiết suất chiếu theo ID.
     */
    public Showtime getShowtimeById(Long id) {
        return showtimeRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Showtime not found with id: " + id));
    }
    
    /**
     * Lấy suất chiếu theo phim.
     */
    public List<Showtime> getShowtimesByMovie(Long movieId) {
        return showtimeRepository.findByMovieId(movieId);
    }
    
    /**
     * Lấy suất chiếu theo rạp.
     */
    public List<Showtime> getShowtimesByCinema(Long cinemaId) {
        return showtimeRepository.findByRoomCinemaId(cinemaId);
    }
    
    /**
     * Lấy suất chiếu theo phim + ngày.
     */
    public List<Showtime> getShowtimesByMovieAndDate(Long movieId, LocalDate date) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime nextDay = startOfDay.plusDays(1);
        return showtimeRepository.findByMovieIdAndDateRange(movieId, startOfDay, nextDay);
    }
    
    /**
     * Lấy suất chiếu theo phim + rạp.
     */
    public List<Showtime> getShowtimesByMovieAndCinema(Long movieId, Long cinemaId) {
        return showtimeRepository.findByMovieIdAndCinemaId(movieId, cinemaId);
    }
    
    /**
     * Lấy suất chiếu theo phim + rạp + ngày.
     */
    public List<Showtime> getShowtimesByMovieAndCinemaAndDate(Long movieId, Long cinemaId, LocalDate date) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime nextDay = startOfDay.plusDays(1);
        return showtimeRepository.findByMovieIdAndCinemaIdAndDateRange(movieId, cinemaId, startOfDay, nextDay);
    }
    
    /**
     * Lấy suất chiếu trong khoảng ngày.
     */
    public List<Showtime> getShowtimesByDateRange(LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);
        return showtimeRepository.findByDateRange(start, end);
    }

    /**
     * Lấy suất chiếu theo rạp + ngày.
     */
    public List<Showtime> getShowtimesByCinemaAndDate(Long cinemaId, LocalDate date) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime nextDay = startOfDay.plusDays(1);
        return showtimeRepository.findByCinemaIdAndDateRange(cinemaId, startOfDay, nextDay);
    }
    
    /**
     * Tạo suất chiếu mới và tự sinh dữ liệu ghế suất chiếu.
     */
    @Transactional
    public Showtime createShowtime(Showtime showtime) {
        validateShowtimeTime(showtime);
        Showtime savedShowtime = showtimeRepository.save(showtime);
        bootstrapShowtimeSeats(savedShowtime);
        return savedShowtime;
    }
    
    /**
     * Cập nhật suất chiếu.
     * Nếu đổi phòng thì reset và tạo lại showtime_seats theo phòng mới.
     */
    @Transactional
    public Showtime updateShowtime(Long id, Showtime showtimeDetails) {
        validateShowtimeTime(showtimeDetails);
        Showtime showtime = getShowtimeById(id);
        Long previousRoomId = showtime.getRoom() != null ? showtime.getRoom().getId() : null;
        showtime.setStartTime(showtimeDetails.getStartTime());
        showtime.setEndTime(showtimeDetails.getEndTime());
        showtime.setBasePrice(showtimeDetails.getBasePrice());
        if (showtimeDetails.getMovie() != null) {
            showtime.setMovie(showtimeDetails.getMovie());
        }
        if (showtimeDetails.getRoom() != null) {
            showtime.setRoom(showtimeDetails.getRoom());
        }
        Showtime updatedShowtime = showtimeRepository.save(showtime);

        Long currentRoomId = updatedShowtime.getRoom() != null ? updatedShowtime.getRoom().getId() : null;
        boolean roomChanged = previousRoomId != null && currentRoomId != null && !previousRoomId.equals(currentRoomId);
        if (roomChanged) {
            showtimeSeatRepository.deleteByShowtimeId(updatedShowtime.getId());
            bootstrapShowtimeSeats(updatedShowtime);
        }
        return updatedShowtime;
    }
    
    /**
     * Xóa suất chiếu theo ID, đồng thời xóa dữ liệu ghế theo suất chiếu.
     */
    @Transactional
    public void deleteShowtime(Long id) {
        Showtime showtime = getShowtimeById(id);
        showtimeSeatRepository.deleteByShowtimeId(id);
        showtimeRepository.delete(showtime);
    }

    /**
     * Validate điều kiện thời gian suất chiếu.
     */
    private void validateShowtimeTime(Showtime showtime) {
        if (showtime == null || showtime.getStartTime() == null || showtime.getEndTime() == null) {
            throw new RuntimeException("Start time and end time are required");
        }
        if (!showtime.getEndTime().isAfter(showtime.getStartTime())) {
            throw new RuntimeException("End time must be after start time");
        }
    }

    /**
     * Khởi tạo ghế cho suất chiếu dựa trên toàn bộ ghế thuộc phòng đã chọn.
     */
    private void bootstrapShowtimeSeats(Showtime showtime) {
        if (showtime == null || showtime.getId() == null || showtime.getRoom() == null || showtime.getRoom().getId() == null) {
            throw new RuntimeException("Room is required");
        }
        if (showtimeSeatRepository.existsByShowtimeId(showtime.getId())) {
            return;
        }

        List<Seat> seats = seatRepository.findByRoomId(showtime.getRoom().getId());
        if (seats.isEmpty()) {
            throw new RuntimeException("No seats found for the selected room");
        }

        List<ShowtimeSeat> showtimeSeats = new ArrayList<>(seats.size());
        for (Seat seat : seats) {
            showtimeSeats.add(ShowtimeSeat.builder()
                    .showtime(showtime)
                    .seat(seat)
                    .price(showtime.getBasePrice())
                    .status("available")
                    .build());
        }
        showtimeSeatRepository.saveAll(showtimeSeats);
    }
}
