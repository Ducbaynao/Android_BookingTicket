package com.example.Android.Repositories;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.Android.Models.MovieGenre;

@Repository
public interface MovieGenreRepository extends JpaRepository<MovieGenre, Long> {
    List<MovieGenre> findByMovie_IdIn(Collection<Long> movieIds);

    List<MovieGenre> findByGenre_IdIn(Collection<Long> genreIds);
}
