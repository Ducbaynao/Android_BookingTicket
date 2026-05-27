package com.example.Android.Services;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.Android.DTO.Requests.CreateMovieRequest;
import com.example.Android.DTO.Requests.UpdateMovieRequest;
import com.example.Android.DTO.Responses.MovieResponse;
import com.example.Android.DTO.Responses.MoviesListResponse;
import com.example.Android.Models.Genre;
import com.example.Android.Models.Movie;
import com.example.Android.Repositories.GenreRepository;
import com.example.Android.Repositories.MovieRepository;
import com.example.Android.Repositories.ShowtimeRepository;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
/**
 * Movie Service
 * Chứa logic nghiệp vụ cho phim (public + admin CRUD).
 */
public class MovieService {
    MovieRepository movieRepository;
    GenreRepository genreRepository;
    ShowtimeRepository showtimeRepository;
    
    /**
     * Lấy toàn bộ phim theo thứ tự mới nhất.
     */
    public MoviesListResponse getAllMovies() {
        log.info("Fetching all movies");
        List<Movie> movies = movieRepository.findAllByOrderByIdDesc();
        
        List<MovieResponse> movieResponses = movies.stream()
                .map(this::convertToMovieResponse)
                .collect(Collectors.toList());
        
        log.info("Found {} movies", movieResponses.size());
        return MoviesListResponse.builder()
                .movies(movieResponses)
                .totalCount(movieResponses.size())
                .message("Movies retrieved successfully")
                .build();
    }
    
    /**
     * Lấy chi tiết phim theo ID.
     */
    public Optional<MovieResponse> getMovieById(Long id) {
        log.info("Fetching movie with ID: {}", id);
        Optional<Movie> movie = movieRepository.findById(id);
        
        if (movie.isPresent()) {
            log.info("Movie found: {}", movie.get().getTitle());
            return Optional.of(convertToMovieResponse(movie.get()));
        } else {
            log.warn("Movie not found with ID: {}", id);
            return Optional.empty();
        }
    }
    
    /**
     * Tìm phim theo từ khóa.
     */
    public MoviesListResponse searchMovies(String keyword) {
        log.info("Searching movies with keyword: {}", keyword);
        List<Movie> movies = movieRepository.findByKeyword(keyword);
        
        List<MovieResponse> movieResponses = movies.stream()
                .map(this::convertToMovieResponse)
                .collect(Collectors.toList());
        
        log.info("Found {} movies matching keyword: {}", movieResponses.size(), keyword);
        return MoviesListResponse.builder()
                .movies(movieResponses)
                .totalCount(movieResponses.size())
                .message("Search results for: " + keyword)
                .build();
    }
    
    /**
     * Lấy phim theo thể loại.
     */
    public MoviesListResponse getMoviesByGenre(String genre) {
        log.info("Fetching movies by genre: {}", genre);
        List<Movie> movies = movieRepository.findByGenreName(genre);
        
        List<MovieResponse> movieResponses = movies.stream()
                .map(this::convertToMovieResponse)
                .collect(Collectors.toList());
        
        log.info("Found {} movies in genre: {}", movieResponses.size(), genre);
        return MoviesListResponse.builder()
                .movies(movieResponses)
                .totalCount(movieResponses.size())
                .message("Movies in genre: " + genre)
                .build();
    }
    
    /**
     * Lấy phim có rating cao hơn ngưỡng chỉ định.
     */
    public MoviesListResponse getHighRatedMovies(Double minRating) {
        log.info("Fetching high-rated movies with rating >= {}", minRating);
        List<Movie> movies = movieRepository.findByRatingGreaterThanEqual(minRating);
        
        List<MovieResponse> movieResponses = movies.stream()
                .map(this::convertToMovieResponse)
                .collect(Collectors.toList());
        
        log.info("Found {} high-rated movies", movieResponses.size());
        return MoviesListResponse.builder()
                .movies(movieResponses)
                .totalCount(movieResponses.size())
                .message("Featured movies with rating >= " + minRating)
                .build();
    }
    
    // ============ ADMIN CRUD OPERATIONS ============
    
    /**
     * Tạo phim mới từ request admin.
     */
    public MovieResponse createMovie(CreateMovieRequest request) {
        log.info("Creating new movie: {}", request.getTitle());
        
        // Create movie entity
        Movie movie = Movie.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .genre(request.getGenre())
                .duration(request.getDuration())
                .rating(request.getRating())
                .posterUrl(request.getPosterUrl())
                .backdropUrl(request.getBackdropUrl())
                .trailerUrl(request.getTrailerUrl())
                .releaseDate(request.getReleaseDate())
                .status(request.getStatus())
                .genres(new HashSet<>())
                .build();
        
        // Add genres if provided
        if (request.getGenreIds() != null && !request.getGenreIds().isEmpty()) {
            Set<Genre> genres = new HashSet<>();
            for (Long genreId : request.getGenreIds()) {
                genreRepository.findById(genreId).ifPresent(genres::add);
            }
            movie.setGenres(genres);
        }
        
        Movie savedMovie = movieRepository.save(movie);
        log.info("Movie created successfully with ID: {}", savedMovie.getId());
        
        return convertToMovieResponse(savedMovie);
    }
    
    /**
     * Cập nhật phim theo ID.
     */
    public MovieResponse updateMovie(Long id, UpdateMovieRequest request) {
        log.info("Updating movie with ID: {}", id);
        
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Movie not found with ID: " + id));
        
        // Update fields if provided
        if (request.getTitle() != null) movie.setTitle(request.getTitle());
        if (request.getDescription() != null) movie.setDescription(request.getDescription());
        if (request.getGenre() != null) movie.setGenre(request.getGenre());
        if (request.getDuration() != null) movie.setDuration(request.getDuration());
        if (request.getRating() != null) movie.setRating(request.getRating());
        if (request.getPosterUrl() != null) movie.setPosterUrl(request.getPosterUrl());
        if (request.getBackdropUrl() != null) movie.setBackdropUrl(request.getBackdropUrl());
        if (request.getTrailerUrl() != null) movie.setTrailerUrl(request.getTrailerUrl());
        if (request.getReleaseDate() != null) movie.setReleaseDate(request.getReleaseDate());
        if (request.getStatus() != null) movie.setStatus(request.getStatus());
        
        // Update genres if provided
        if (request.getGenreIds() != null) {
            Set<Genre> genres = new HashSet<>();
            for (Long genreId : request.getGenreIds()) {
                genreRepository.findById(genreId).ifPresent(genres::add);
            }
            movie.setGenres(genres);
        }
        
        Movie updatedMovie = movieRepository.save(movie);
        log.info("Movie updated successfully: {}", updatedMovie.getTitle());
        
        return convertToMovieResponse(updatedMovie);
    }
    
    /**
     * Xóa phim theo ID.
     * Có xử lý xóa toàn bộ showtime liên quan trước khi xóa phim.
     */
    @Transactional
    public void deleteMovie(Long id) {
        log.info("Deleting movie with ID: {}", id);
        
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Movie not found with ID: " + id));

        List<com.example.Android.Models.Showtime> showtimes = showtimeRepository.findByMovieId(id);
        if (!showtimes.isEmpty()) {
            showtimeRepository.deleteAll(showtimes);
        }
        
        movieRepository.delete(movie);
        log.info("Movie deleted successfully: {}", movie.getTitle());
    }
    
    /**
     * Lấy danh sách phim theo trạng thái (SHOWING/COMING_SOON/ENDED...).
     */
    public MoviesListResponse getMoviesByStatus(String status) {
        log.info("Fetching movies with status: {}", status);
        List<Movie> movies = movieRepository.findByStatus(status);
        
        List<MovieResponse> movieResponses = movies.stream()
                .map(this::convertToMovieResponse)
                .collect(Collectors.toList());
        
        log.info("Found {} movies with status: {}", movieResponses.size(), status);
        return MoviesListResponse.builder()
                .movies(movieResponses)
                .totalCount(movieResponses.size())
                .message("Movies with status: " + status)
                .build();
    }
    
    /**
     * Mapping entity Movie sang DTO MovieResponse cho response API.
     */
    private MovieResponse convertToMovieResponse(Movie movie) {
        List<String> genreNames = movie.getGenres().stream()
                .map(genre -> genre.getName())
                .collect(Collectors.toList());
                
        return MovieResponse.builder()
                .id(movie.getId())
                .title(movie.getTitle())
                .description(movie.getDescription())
                .genre(movie.getGenre())
                .genres(genreNames)
                .duration(movie.getDuration())
                .rating(movie.getRating())
                .posterUrl(movie.getPosterUrl())
                .backdropUrl(movie.getBackdropUrl())
                .trailerUrl(movie.getTrailerUrl())
                .releaseDate(movie.getReleaseDate())
                .status(movie.getStatus())
                .createdAt(movie.getCreatedAt())
                .build();
    }
}
