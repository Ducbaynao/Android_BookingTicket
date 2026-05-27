package com.example.Android.DTO.Responses;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BookingResponse {
    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private Long showtimeId;
    private String movieTitle;
    private String cinemaName;
    private String roomName;
    private LocalDateTime showtime;
    private Double totalAmount;
    private String status;
    private LocalDateTime createdAt;
    private Integer seatCount;
}
