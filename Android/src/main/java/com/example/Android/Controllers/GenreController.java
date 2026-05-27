package com.example.Android.Controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.Android.Services.GenreService;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/genres")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class GenreController {
    GenreService genreService;
    
    @GetMapping
    public ResponseEntity<List<String>> getAllGenres() {
        log.info("API request: GET /api/genres - Fetching all genres");
        try {
            List<String> genres = genreService.getAllGenreNames();
            log.info("Successfully retrieved {} genres", genres.size());
            return ResponseEntity.ok(genres);
        } catch (Exception e) {
            log.error("Error fetching genres: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
