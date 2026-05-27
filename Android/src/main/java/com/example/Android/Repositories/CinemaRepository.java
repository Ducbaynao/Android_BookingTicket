package com.example.Android.Repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.Android.Models.Cinema;

@Repository
public interface CinemaRepository extends JpaRepository<Cinema, Long> {
    List<Cinema> findByCity(String city);
    Optional<Cinema> findByName(String name);
    List<Cinema> findByCityContainingIgnoreCase(String city);
}
