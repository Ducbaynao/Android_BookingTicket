package com.example.Android.Services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.Android.Models.ShowtimeSeat;
import com.example.Android.Repositories.ShowtimeSeatRepository;

@Service
public class ShowtimeSeatService {
    
    @Autowired
    private ShowtimeSeatRepository showtimeSeatRepository;
    
    public List<ShowtimeSeat> getSeatsByShowtime(Long showtimeId) {
        return showtimeSeatRepository.findByShowtimeId(showtimeId);
    }
    
    public List<ShowtimeSeat> getAvailableSeatsByShowtime(Long showtimeId) {
        return showtimeSeatRepository.findAvailableSeatsByShowtimeId(showtimeId);
    }
    
    public Long countAvailableSeats(Long showtimeId) {
        return showtimeSeatRepository.countAvailableSeatsByShowtimeId(showtimeId);
    }
    
    public ShowtimeSeat getSeatById(Long id) {
        return showtimeSeatRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Seat not found with id: " + id));
    }
    
    public void markSeatAsBooked(Long seatId) {
        ShowtimeSeat seat = getSeatById(seatId);
        seat.setStatus("BOOKED");
        showtimeSeatRepository.save(seat);
    }
    
    public void markSeatAsHeld(Long seatId) {
        ShowtimeSeat seat = getSeatById(seatId);
        seat.setStatus("HELD");
        showtimeSeatRepository.save(seat);
    }
    
    public void markSeatsAsBooked(List<Long> seatIds) {
        for (Long seatId : seatIds) {
            markSeatAsBooked(seatId);
        }
    }
    
    public void markSeatsAsHeld(List<Long> seatIds) {
        for (Long seatId : seatIds) {
            markSeatAsHeld(seatId);
        }
    }
    
    public void releaseSeat(Long seatId) {
        ShowtimeSeat seat = getSeatById(seatId);
        seat.setStatus("AVAILABLE");
        showtimeSeatRepository.save(seat);
    }
}
