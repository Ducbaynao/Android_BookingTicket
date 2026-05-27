package com.example.Android.Models;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "showtime_seats")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShowtimeSeat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "showtime_id", nullable = false)
    private Showtime showtime;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seat_id", nullable = false)
    private Seat seat;
    
    @Column(precision = 10, nullable = false)
    private Double price;
    
    @Column(nullable = false)
    @Builder.Default
    private String status = "available"; // available, booked, blocked
    
    // Helper method to check if seat is available
    public boolean isAvailable() {
        return "available".equalsIgnoreCase(status);
    }
}
