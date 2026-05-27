package com.example.Android.DTO.Responses;

import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MovieResponse {
    private Long id;
    private String title;
    private String description;
    private String genre;
    private List<String> genres;
    private Integer duration;
    private Double rating;
    private String posterUrl;
    private String backdropUrl;
    private String trailerUrl;
    private LocalDateTime releaseDate;
    private String status;
    private LocalDateTime createdAt;
}