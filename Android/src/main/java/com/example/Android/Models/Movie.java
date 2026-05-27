package com.example.Android.Models;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "movies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class Movie {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    
    @Column(nullable = false)
    String title;
    
    @Column(columnDefinition = "TEXT")
    String description;
    
    String genre;
    
    Integer duration;
    
    Double rating;
    
    @Column(name = "poster_url")
    String posterUrl;
    
    @Column(name = "backdrop_url")
    String backdropUrl;
    
    @Column(name = "trailer_url")
    String trailerUrl;
    
    @Column(name = "release_date")
    LocalDateTime releaseDate;
    
    String status;
    
    @ManyToMany
    @JoinTable(
        name = "movie_genres",
        joinColumns = @JoinColumn(name = "movie_id"),
        inverseJoinColumns = @JoinColumn(name = "genre_id")
    )
    @Builder.Default
    Set<Genre> genres = new HashSet<>();
    
    @Column(name = "created_at")
    @CreationTimestamp
    LocalDateTime createdAt;
    
    @Column(name = "updated_at") 
    @UpdateTimestamp
    LocalDateTime updatedAt;
}