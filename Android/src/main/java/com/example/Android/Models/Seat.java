package com.example.Android.Models;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "seats")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Seat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;
    
    @Column(name = "seat_row", nullable = false)
    private String seatRow;
    
    @Column(name = "seat_number", nullable = false)
    private Integer seatNumber;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seat_type_id")
    private SeatType seatType;
    
    // Helper method to get full seat number (e.g., "A5")
    public String getFullSeatNumber() {
        return seatRow + seatNumber;
    }
}
