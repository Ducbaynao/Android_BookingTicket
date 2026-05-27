package com.example.Android.DTO.Requests;

import java.time.LocalDateTime;
import java.util.Set;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateMovieRequest {
    
    private String title;
    
    private String description;
    
    private String genre;
    
    private Integer duration;
    
    private Double rating;
    
    private String posterUrl;
    
    private String backdropUrl;
    
    private String trailerUrl;
    
    private LocalDateTime releaseDate;
    
    private String status; // SHOWING, COMING_SOON, ENDED
    
    private Set<Long> genreIds;
}
