package com.example.Android.Models;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "seat_types")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SeatType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(name = "price_modifier", precision = 10)
    private Double priceModifier;
}
