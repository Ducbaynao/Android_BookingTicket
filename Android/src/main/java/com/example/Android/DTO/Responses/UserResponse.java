package com.example.Android.DTO.Responses;

import java.time.LocalDateTime;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Builder;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserResponse {
    private Long id;
    private String name;
    private String email;
    private String role;
    private String status;
    private LocalDateTime createdAt;
    
    // Loyalty Program Fields
    private Double totalSpending;
    private Integer loyaltyPoints;
    private String loyaltyTier;
    private LocalDateTime tierUpdatedAt;
}
