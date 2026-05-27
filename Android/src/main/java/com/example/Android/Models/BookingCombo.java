package com.example.Android.Models;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "booking_combos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingCombo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "combo_id", nullable = false)
    private Combo combo;
    
    @Column(nullable = false)
    private Integer quantity;
    
    @Column(name = "total_price", precision = 10, nullable = false)
    private Double totalPrice;
}
