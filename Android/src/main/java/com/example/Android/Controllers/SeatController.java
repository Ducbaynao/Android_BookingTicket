package com.example.Android.Controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.Android.Models.ShowtimeSeat;
import com.example.Android.Services.ShowtimeSeatService;

@RestController
@RequestMapping("/api/seats")
@CrossOrigin(origins = "*")
public class SeatController {
    
    @Autowired
    private ShowtimeSeatService showtimeSeatService;
    
    @GetMapping("/showtime/{showtimeId}")
    public ResponseEntity<List<ShowtimeSeat>> getSeatsByShowtime(@PathVariable Long showtimeId) {
        return ResponseEntity.ok(showtimeSeatService.getSeatsByShowtime(showtimeId));
    }
    
    @GetMapping("/showtime/{showtimeId}/available")
    public ResponseEntity<List<ShowtimeSeat>> getAvailableSeats(@PathVariable Long showtimeId) {
        return ResponseEntity.ok(showtimeSeatService.getAvailableSeatsByShowtime(showtimeId));
    }
    
    @GetMapping("/showtime/{showtimeId}/count")
    public ResponseEntity<Long> countAvailableSeats(@PathVariable Long showtimeId) {
        return ResponseEntity.ok(showtimeSeatService.countAvailableSeats(showtimeId));
    }
    
    @PostMapping("/{seatId}/book")
    public ResponseEntity<Void> markSeatAsBooked(@PathVariable Long seatId) {
        showtimeSeatService.markSeatAsBooked(seatId);
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/{seatId}/release")
    public ResponseEntity<Void> releaseSeat(@PathVariable Long seatId) {
        showtimeSeatService.releaseSeat(seatId);
        return ResponseEntity.ok().build();
    }
}
