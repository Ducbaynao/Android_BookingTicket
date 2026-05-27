package com.example.Android.Models;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

import org.hibernate.annotations.CreationTimestamp;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "bookings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = true)
    private User user;

    @Column(name = "user_name_snapshot")
    private String userNameSnapshot;

    @Column(name = "user_email_snapshot")
    private String userEmailSnapshot;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "showtime_id", nullable = false)
    private Showtime showtime;
    
    @Column(name = "total_amount", precision = 10, nullable = false)
    private Double totalAmount;
    
    @Column(nullable = false)
    @Builder.Default
    private String status = "pending"; // pending, confirmed, cancelled
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<BookingSeat> bookingSeats = new HashSet<>();
    
    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<BookingCombo> bookingCombos = new HashSet<>();
    
    @OneToOne(mappedBy = "booking", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore // Prevent circular reference
    private Payment payment;
    
    // Additional fields for frontend compatibility
    @Column(name = "qr_code")
    private String qrCode;
    
    @Column(name = "booking_date")
    private LocalDateTime bookingDate;
    
    // Helper method to generate QR code string
    public String generateQRCode() {
        return "TK-" + id + "-" + System.currentTimeMillis();
    }
    
    // Set booking date when created
    @PrePersist
    protected void onCreate() {
        if (bookingDate == null) {
            bookingDate = LocalDateTime.now();
        }
        if (qrCode == null) {
            qrCode = generateQRCode();
        }
    }
}
