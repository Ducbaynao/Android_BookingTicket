package com.example.Android.Controllers;

import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.Android.DTO.Requests.MovieSelectReq;
import com.example.Android.DTO.Responses.MovieResponse;
import com.example.Android.DTO.Responses.MoviesListResponse;
import com.example.Android.Services.MovieService;
import com.example.Android.Services.RecommendationProducer;
import com.example.Android.Services.RecommendationService;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/movies")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class MovieController {
    MovieService movieService;
    RecommendationService recommendationService;
    RecommendationProducer recommendationProducer;
    
    @GetMapping
    public ResponseEntity<MoviesListResponse> getAllMovies() {
        log.info("API request: GET /api/movies - Fetching all movies");
        try {
            MoviesListResponse response = movieService.getAllMovies();
            log.info("Successfully retrieved {} movies", response.getTotalCount());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching movies: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<MovieResponse> getMovieById(@PathVariable Long id) {
        log.info("API request: GET /api/movies/{} - Fetching movie details", id);
        try {
            Optional<MovieResponse> movie = movieService.getMovieById(id);
            
            if (movie.isPresent()) {
                log.info("Movie found: {}", movie.get().getTitle());
                return ResponseEntity.ok(movie.get());
            } else {
                log.warn("Movie not found with ID: {}", id);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error fetching movie {}: {}", id, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/search")
    public ResponseEntity<MoviesListResponse> searchMovies(@RequestParam String keyword) {
        log.info("API request: GET /api/movies/search?keyword={} - Searching movies", keyword);
        try {
            if (keyword == null || keyword.trim().isEmpty()) {
                log.warn("Empty search keyword provided");
                return ResponseEntity.badRequest().build();
            }
            
            MoviesListResponse response = movieService.searchMovies(keyword.trim());
            log.info("Search completed: {} movies found for keyword '{}'", 
                    response.getTotalCount(), keyword);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error searching movies with keyword '{}': {}", keyword, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/genre/{genre}")
    public ResponseEntity<MoviesListResponse> getMoviesByGenre(@PathVariable String genre) {
        log.info("API request: GET /api/movies/genre/{} - Fetching movies by genre", genre);
        try {
            if (genre == null || genre.trim().isEmpty()) {
                log.warn("Empty genre provided");
                return ResponseEntity.badRequest().build();
            }
            
            MoviesListResponse response = movieService.getMoviesByGenre(genre.trim());
            log.info("Genre search completed: {} movies found for genre '{}'", 
                    response.getTotalCount(), genre);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching movies by genre '{}': {}", genre, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/featured")
    public ResponseEntity<MoviesListResponse> getFeaturedMovies() {
        log.info("API request: GET /api/movies/featured - Fetching featured movies");
        try {
            // Get movies with rating >= 8.0 as featured
            MoviesListResponse response = movieService.getHighRatedMovies(8.0);
            log.info("Featured movies retrieved: {} movies", response.getTotalCount());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching featured movies: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/select")
    public ResponseEntity<?> selectMovie(@RequestBody MovieSelectReq req, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        if (req == null || req.getMovieId() == null) {
            return ResponseEntity.badRequest().body("movieId is required");
        }

        String principal = authentication.getName();
        ResponseEntity<String> saveResult = recommendationService.saveWatchHistory(principal, req.getMovieId());
        if (!saveResult.getStatusCode().is2xxSuccessful()) {
            return saveResult;
        }

        recommendationProducer.sendMovieSelectedEvent(req.getMovieId(), principal);
        return ResponseEntity.status(202).body("Movie selection accepted");
    }
}
