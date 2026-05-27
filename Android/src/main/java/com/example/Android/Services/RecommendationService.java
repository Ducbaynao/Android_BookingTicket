package com.example.Android.Services;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.Android.DTO.Responses.GenresResponse;
import com.example.Android.DTO.Responses.RecommendationMoviesResponse;
import com.example.Android.DTO.Responses.RecommendedMovieItem;
import com.example.Android.Models.Booking;
import com.example.Android.Models.Genre;
import com.example.Android.Models.Movie;
import com.example.Android.Models.MovieGenre;
import com.example.Android.Models.User;
import com.example.Android.Models.UserGenrePreference;
import com.example.Android.Repositories.GenreRepository;
import com.example.Android.Repositories.MovieGenreRepository;
import com.example.Android.Repositories.MovieRecommendationRepository;
import com.example.Android.Repositories.MovieRepository;
import com.example.Android.Repositories.UserGenrePreferenceRepository;
import com.example.Android.Repositories.UserMovieInteractionRepository;
import com.example.Android.Repositories.UserRepository;
import com.example.Android.Repositories.WatchHistoryRepository;
import com.example.Android.userinteraction.entity.MovieRecommendation;
import com.example.Android.userinteraction.entity.UserMovieInteraction;
import com.example.Android.userinteraction.entity.WatchHistory;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class RecommendationService {
    GenreRepository genreRepository;
    UserRepository userRepository;
    MovieRepository movieRepository;
    MovieGenreRepository movieGenreRepository;
    UserGenrePreferenceRepository userGenrePreferenceRepository;
    UserMovieInteractionRepository userMovieInteractionRepository;
    WatchHistoryRepository watchHistoryRepository;
    MovieRecommendationRepository movieRecommendationRepository;

    public ResponseEntity<GenresResponse> getAllGenres() {
        List<Genre> genres = genreRepository.findAll();
        if (genres.isEmpty()) {
            return ResponseEntity.status(404).body(GenresResponse.builder()
                    .statusCode(404)
                    .message("No genres found")
                    .genres(genres)
                    .build());
        }
        return ResponseEntity.ok(GenresResponse.builder()
                .statusCode(200)
                .message("Genres fetched successfully")
                .genres(genres)
                .build());
    }

    @Transactional
    public ResponseEntity<String> saveSelectedGenres(String principal, List<Long> genreIds) {
        if (genreIds == null || genreIds.isEmpty()) {
            return ResponseEntity.badRequest().body("Genres list cannot be empty");
        }

        List<Long> normalizedGenreIds = genreIds.stream()
                .filter(id -> id != null)
                .collect(Collectors.collectingAndThen(Collectors.toCollection(LinkedHashSet::new), ArrayList::new));

        if (normalizedGenreIds.isEmpty()) {
            return ResponseEntity.badRequest().body("Genres list cannot be empty");
        }

        User user = resolveUser(principal);
        if (user == null) {
            return ResponseEntity.badRequest().body("User not found");
        }

        List<Genre> genres = genreRepository.findAllById(normalizedGenreIds);
        if (genres.isEmpty()) {
            return ResponseEntity.badRequest().body("No valid genres found");
        }

        Set<Long> requestedGenreIds = genres.stream()
                .map(Genre::getId)
                .collect(Collectors.toSet());

        List<UserGenrePreference> existingPreferences = userGenrePreferenceRepository.findByUser(user);

        Set<Long> existingGenreIds = existingPreferences.stream()
                .map(preference -> preference.getGenre().getId())
                .collect(Collectors.toSet());

        List<UserGenrePreference> preferencesToDelete = existingPreferences.stream()
                .filter(preference -> !requestedGenreIds.contains(preference.getGenre().getId()))
                .toList();

        if (!preferencesToDelete.isEmpty()) {
            userGenrePreferenceRepository.deleteAll(preferencesToDelete);
        }

        List<UserGenrePreference> preferencesToCreate = genres.stream()
                .filter(genre -> !existingGenreIds.contains(genre.getId()))
                .map(genre -> UserGenrePreference.builder()
                        .user(user)
                        .genre(genre)
                        .build())
                .toList();

        if (!preferencesToCreate.isEmpty()) {
            userGenrePreferenceRepository.saveAll(preferencesToCreate);
        }

        return ResponseEntity.ok("Genres saved successfully");
    }

    @Transactional
    public ResponseEntity<String> saveWatchHistory(String principal, Long movieId) {
        if (movieId == null) {
            return ResponseEntity.badRequest().body("movieId is required");
        }

        User user = resolveUser(principal);
        if (user == null) {
            return ResponseEntity.badRequest().body("User not found");
        }

        Movie movie = movieRepository.findById(movieId).orElse(null);
        if (movie == null) {
            return ResponseEntity.badRequest().body("Movie not found");
        }

        if (watchHistoryRepository.existsByUserAndMovie(user, movie)) {
            saveInteraction(user, movie, "MOVIE_SELECTED", 2);
            return ResponseEntity.ok("Movie already exists in watch history");
        }

        WatchHistory history = WatchHistory.builder()
                .user(user)
                .movie(movie)
                .watchedAt(LocalDateTime.now())
                .build();
        watchHistoryRepository.save(history);
        saveInteraction(user, movie, "MOVIE_SELECTED", 2);

        return ResponseEntity.ok("Watch history saved");
    }

    public ResponseEntity<RecommendationMoviesResponse> recommendMovies(String principal, Integer limit) {
        int recommendationLimit = limit == null || limit <= 0 ? 10 : limit;
        User user = resolveUser(principal);
        if (user == null) {
            return ResponseEntity.badRequest().body(RecommendationMoviesResponse.builder()
                    .statusCode(400)
                    .message("User not found")
                    .movies(List.of())
                    .build());
        }

        List<WatchHistory> histories = watchHistoryRepository.findByUserOrderByWatchedAtDesc(user);
        List<UserMovieInteraction> interactions = userMovieInteractionRepository.findByUserOrderByCreatedAtDesc(user);

        List<RecommendedMovieItem> recommendations;
        String message;

        if (!interactions.isEmpty()) {
            recommendations = recommendFromInteractions(interactions, recommendationLimit);
            message = "Recommendations generated from user interactions";
        } else if (!histories.isEmpty()) {
            recommendations = recommendFromWatchHistory(histories, recommendationLimit);
            message = "Recommendations generated from watch history";
        } else {
            recommendations = recommendFromSelectedGenres(user, recommendationLimit);
            message = "No interactions/history, fallback to selected genres";
        }

        return ResponseEntity.ok(RecommendationMoviesResponse.builder()
                .statusCode(200)
                .message(message)
                .movies(recommendations)
                .build());
    }

    @Transactional
    public void processRecommendationEvent(String principal, Integer limit) {
        int recommendationLimit = limit == null || limit <= 0 ? 20 : limit;
        User user = resolveUser(principal);
        if (user == null) {
            return;
        }

        List<WatchHistory> histories = watchHistoryRepository.findByUserOrderByWatchedAtDesc(user);
        List<UserMovieInteraction> interactions = userMovieInteractionRepository.findByUserOrderByCreatedAtDesc(user);
        List<RecommendedMovieItem> recommendations;
        if (!interactions.isEmpty()) {
            recommendations = recommendFromInteractions(interactions, recommendationLimit);
        } else if (!histories.isEmpty()) {
            recommendations = recommendFromWatchHistory(histories, recommendationLimit);
        } else {
            recommendations = recommendFromSelectedGenres(user, recommendationLimit);
        }

        movieRecommendationRepository.deleteByUser(user);
        if (recommendations.isEmpty()) {
            return;
        }

        List<Long> movieIds = recommendations.stream().map(RecommendedMovieItem::getMovieId).toList();
        Map<Long, Movie> movieById = movieRepository.findAllById(movieIds).stream()
                .collect(Collectors.toMap(Movie::getId, movie -> movie));

        List<MovieRecommendation> entities = recommendations.stream()
                .map(item -> MovieRecommendation.builder()
                        .user(user)
                        .movie(movieById.get(item.getMovieId()))
                        .score(item.getScore())
                        .build())
                .filter(entity -> entity.getMovie() != null)
                .toList();

        movieRecommendationRepository.saveAll(entities);
    }

    private List<RecommendedMovieItem> recommendFromWatchHistory(List<WatchHistory> histories, int limit) {
        Set<Long> watchedMovieIds = histories.stream()
                .map(history -> history.getMovie().getId())
                .collect(Collectors.toSet());
        if (watchedMovieIds.isEmpty()) {
            return List.of();
        }

        Map<Long, Integer> genreWeight = new HashMap<>();
        List<MovieGenre> watchedMovieGenres = movieGenreRepository.findByMovie_IdIn(watchedMovieIds);
        for (MovieGenre movieGenre : watchedMovieGenres) {
            Long genreId = movieGenre.getGenre().getId();
            genreWeight.put(genreId, genreWeight.getOrDefault(genreId, 0) + 1);
        }
        if (genreWeight.isEmpty()) {
            return List.of();
        }

        Map<Long, Double> candidateScore = new HashMap<>();
        List<MovieGenre> candidateRelations = movieGenreRepository.findByGenre_IdIn(genreWeight.keySet());
        for (MovieGenre relation : candidateRelations) {
            Long movieId = relation.getMovie().getId();
            if (watchedMovieIds.contains(movieId)) {
                continue;
            }
            Long genreId = relation.getGenre().getId();
            candidateScore.put(movieId,
                    candidateScore.getOrDefault(movieId, 0.0) + genreWeight.getOrDefault(genreId, 0));
        }

        return buildRecommendationResult(candidateScore, "CONTENT_BASED_HISTORY", limit);
    }

    private List<RecommendedMovieItem> recommendFromInteractions(List<UserMovieInteraction> interactions, int limit) {
        Set<Long> interactedMovieIds = interactions.stream()
                .map(interaction -> interaction.getMovie().getId())
                .collect(Collectors.toSet());
        if (interactedMovieIds.isEmpty()) {
            return List.of();
        }

        Map<Long, Integer> genreWeight = new HashMap<>();
        List<MovieGenre> interactedMovieGenres = movieGenreRepository.findByMovie_IdIn(interactedMovieIds);
        for (MovieGenre movieGenre : interactedMovieGenres) {
            Long movieId = movieGenre.getMovie().getId();
            Long genreId = movieGenre.getGenre().getId();

            int interactionScore = interactions.stream()
                    .filter(interaction -> interaction.getMovie().getId().equals(movieId))
                    .map(UserMovieInteraction::getScore)
                    .filter(score -> score != null && score > 0)
                    .max(Integer::compareTo)
                    .orElse(1);

            genreWeight.put(genreId, genreWeight.getOrDefault(genreId, 0) + interactionScore);
        }
        if (genreWeight.isEmpty()) {
            return List.of();
        }

        Map<Long, Double> candidateScore = new HashMap<>();
        List<MovieGenre> candidateRelations = movieGenreRepository.findByGenre_IdIn(genreWeight.keySet());
        for (MovieGenre relation : candidateRelations) {
            Long movieId = relation.getMovie().getId();
            if (interactedMovieIds.contains(movieId)) {
                continue;
            }
            Long genreId = relation.getGenre().getId();
            candidateScore.put(movieId,
                    candidateScore.getOrDefault(movieId, 0.0) + genreWeight.getOrDefault(genreId, 0));
        }

        return buildRecommendationResult(candidateScore, "INTERACTION_BASED", limit);
    }

    private List<RecommendedMovieItem> recommendFromSelectedGenres(User user, int limit) {
        List<UserGenrePreference> preferences = userGenrePreferenceRepository.findByUser(user);
        if (preferences.isEmpty()) {
            return List.of();
        }

        Set<Long> genreIds = preferences.stream()
                .map(preference -> preference.getGenre().getId())
                .collect(Collectors.toSet());

        List<MovieGenre> candidateRelations = movieGenreRepository.findByGenre_IdIn(genreIds);
        Map<Long, Double> candidateScore = new HashMap<>();
        for (MovieGenre relation : candidateRelations) {
            Long movieId = relation.getMovie().getId();
            candidateScore.put(movieId, candidateScore.getOrDefault(movieId, 0.0) + 1.0);
        }

        return buildRecommendationResult(candidateScore, "GENRE_FALLBACK", limit);
    }

    private List<RecommendedMovieItem> buildRecommendationResult(Map<Long, Double> candidateScore, String strategy,
            int limit) {
        if (candidateScore.isEmpty()) {
            return List.of();
        }

        LinkedHashMap<Long, Double> sortedScore = candidateScore.entrySet().stream()
                .sorted(Map.Entry.<Long, Double>comparingByValue(Comparator.reverseOrder()))
                .limit(limit)
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (left, right) -> left,
                        LinkedHashMap::new));

        Map<Long, Movie> movieById = movieRepository.findAllById(sortedScore.keySet()).stream()
                .collect(Collectors.toMap(Movie::getId, movie -> movie));

        List<RecommendedMovieItem> result = new ArrayList<>();
        for (Long movieId : sortedScore.keySet()) {
            Movie movie = movieById.get(movieId);
            if (movie == null) {
                continue;
            }

            result.add(RecommendedMovieItem.builder()
                    .movieId(movie.getId())
                    .title(movie.getTitle())
                    .posterUrl(movie.getPosterUrl())
                    .status(movie.getStatus())
                    .score(BigDecimal.valueOf(sortedScore.get(movieId)))
                    .strategy(strategy)
                    .build());
        }
        return result;
    }

    private User resolveUser(String principal) {
        if (principal == null || principal.isBlank()) {
            return null;
        }

        User userByEmail = userRepository.findUserByEmail(principal).orElse(null);
        if (userByEmail != null) {
            return userByEmail;
        }

        try {
            Long userId = Long.valueOf(principal);
            return userRepository.findById(userId).orElse(null);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    @Transactional
    public void saveInteractionForMovie(String principal, Long movieId, String interactionType, int score) {
        if (movieId == null) {
            return;
        }

        User user = resolveUser(principal);
        if (user == null) {
            return;
        }

        Movie movie = movieRepository.findById(movieId).orElse(null);
        if (movie == null) {
            return;
        }

        saveInteraction(user, movie, interactionType, score);
    }

    @Transactional
    public void saveBookingInteraction(Booking booking) {
        if (booking == null || booking.getUser() == null || booking.getShowtime() == null
                || booking.getShowtime().getMovie() == null) {
            return;
        }
        saveInteraction(booking.getUser(), booking.getShowtime().getMovie(), "BOOKING_CONFIRMED", 5);
    }

    private void saveInteraction(User user, Movie movie, String type, int score) {
        UserMovieInteraction interaction = UserMovieInteraction.builder()
                .user(user)
                .movie(movie)
                .type(type)
                .score(score)
                .build();
        userMovieInteractionRepository.save(interaction);
    }
}
