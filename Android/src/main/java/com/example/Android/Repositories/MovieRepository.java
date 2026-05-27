package com.example.Android.Repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.Android.Models.Movie;

@Repository
public interface MovieRepository extends JpaRepository<Movie, Long> {
    
    List<Movie> findAllByOrderByIdDesc();
    
    List<Movie> findByGenreContainingIgnoreCase(String genre);
    
    @Query("SELECT DISTINCT m FROM Movie m JOIN m.genres g WHERE LOWER(g.name) = LOWER(:genreName)")
    List<Movie> findByGenreName(@Param("genreName") String genreName);
    
    @Query("SELECT m FROM Movie m WHERE LOWER(m.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(m.description) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Movie> findByKeyword(@Param("keyword") String keyword);
    
    @Query("SELECT m FROM Movie m WHERE m.rating >= :minRating ORDER BY m.rating DESC")
    List<Movie> findByRatingGreaterThanEqual(@Param("minRating") Double minRating);
    
    List<Movie> findByStatus(String status);
    
    Optional<Movie> findById(Long id);
}