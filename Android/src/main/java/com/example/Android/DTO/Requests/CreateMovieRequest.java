package com.example.Android.DTO.Requests;

import java.time.LocalDateTime;
import java.util.Set;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateMovieRequest {
    
    @NotBlank(message = "Title is required")
    private String title;
    
    @NotBlank(message = "Description is required")
    private String description;
    
    private String genre;
    
    @NotNull(message = "Duration is required")
    @Positive(message = "Duration must be positive")
    private Integer duration;
    
    private Double rating;
    
    private String posterUrl;
    
    private String backdropUrl;
    
    private String trailerUrl;
    
    private LocalDateTime releaseDate;
    
    @NotBlank(message = "Status is required")
    private String status; // SHOWING, COMING_SOON, ENDED
    
    private Set<Long> genreIds;
}
