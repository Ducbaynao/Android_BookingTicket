package com.example.Android.Models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "full_name", nullable = false)
    private String name;
    
    @Column(nullable = false, unique = true)
    private String email;
    
    @Column(name = "password_hash", nullable = false)
    private String password;
    
    @Column(nullable = false)
    private String role = "USER";
    
    @Column(nullable = false)
    private String status = "ACTIVE";
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Loyalty Program Fields
    @Column(name = "total_spending")
    @Builder.Default
    private Double totalSpending = 0.0;
    
    @Column(name = "loyalty_points")
    @Builder.Default
    private Integer loyaltyPoints = 0;
    
    @Column(name = "loyalty_tier")
    @Builder.Default
    private String loyaltyTier = "BRONZE";
    
    @Column(name = "tier_updated_at")
    private LocalDateTime tierUpdatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
