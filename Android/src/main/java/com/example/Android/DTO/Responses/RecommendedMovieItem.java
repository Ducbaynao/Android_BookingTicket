package com.example.Android.DTO.Responses;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendedMovieItem {
    private Long movieId;
    private String title;
    private String posterUrl;
    private String status;
    private BigDecimal score;
    private String strategy;
}
