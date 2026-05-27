package com.example.Android.Services;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.example.Android.Models.Genre;
import com.example.Android.Repositories.GenreRepository;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class GenreService {
    GenreRepository genreRepository;
    
    public List<String> getAllGenreNames() {
        log.info("Fetching all genre names");
        List<Genre> genres = genreRepository.findAll();
        List<String> genreNames = genres.stream()
                .map(Genre::getName)
                .sorted()
                .collect(Collectors.toList());
        log.info("Found {} genres", genreNames.size());
        return genreNames;
    }
}
