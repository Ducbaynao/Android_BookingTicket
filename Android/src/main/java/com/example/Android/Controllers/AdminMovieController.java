package com.example.Android.Controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.Android.DTO.Requests.CreateMovieRequest;
import com.example.Android.DTO.Requests.UpdateMovieRequest;
import com.example.Android.DTO.Responses.MovieResponse;
import com.example.Android.DTO.Responses.MoviesListResponse;
import com.example.Android.Services.MovieService;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/admin/movies")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
/**
 * Admin Movie Controller
 * Cung cấp API cho chức năng quản lí phim ở màn hình admin.
 */
public class AdminMovieController {
    
    MovieService movieService;
    
    /**
     * API: POST /api/admin/movies
     * Tạo phim mới.
     */
    @PostMapping
    public ResponseEntity<MovieResponse> createMovie(@Valid @RequestBody CreateMovieRequest request) {
        log.info("Admin creating movie: {}", request.getTitle());
        try {
            MovieResponse movie = movieService.createMovie(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(movie);
        } catch (Exception e) {
            log.error("Error creating movie: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * API: PUT /api/admin/movies/{id}
     * Cập nhật thông tin phim theo ID.
     */
    @PutMapping("/{id}")
    public ResponseEntity<MovieResponse> updateMovie(
            @PathVariable Long id, 
            @Valid @RequestBody UpdateMovieRequest request) {
        log.info("Admin updating movie with ID: {}", id);
        try {
            MovieResponse movie = movieService.updateMovie(id, request);
            return ResponseEntity.ok(movie);
        } catch (RuntimeException e) {
            log.error("Movie not found: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error updating movie: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * API: DELETE /api/admin/movies/{id}
     * Xóa phim theo ID.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMovie(@PathVariable Long id) {
        log.info("Admin deleting movie with ID: {}", id);
        try {
            movieService.deleteMovie(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Movie not found: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error deleting movie: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * API: GET /api/admin/movies/status/{status}
     * Lấy danh sách phim theo trạng thái.
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<MoviesListResponse> getMoviesByStatus(@PathVariable String status) {
        log.info("Fetching movies with status: {}", status);
        try {
            MoviesListResponse response = movieService.getMoviesByStatus(status);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching movies by status: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
