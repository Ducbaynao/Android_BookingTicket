package com.example.Android.Services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.Android.Models.Cinema;
import com.example.Android.Repositories.CinemaRepository;

@Service
public class CinemaService {
    
    @Autowired
    private CinemaRepository cinemaRepository;
    
    public List<Cinema> getAllCinemas() {
        return cinemaRepository.findAll();
    }
    
    public Cinema getCinemaById(Long id) {
        return cinemaRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Cinema not found with id: " + id));
    }
    
    public List<Cinema> getCinemasByCity(String city) {
        return cinemaRepository.findByCityContainingIgnoreCase(city);
    }
    
    public Cinema createCinema(Cinema cinema) {
        return cinemaRepository.save(cinema);
    }
    
    public Cinema updateCinema(Long id, Cinema cinemaDetails) {
        Cinema cinema = getCinemaById(id);
        cinema.setName(cinemaDetails.getName());
        cinema.setAddress(cinemaDetails.getAddress());
        cinema.setCity(cinemaDetails.getCity());
        return cinemaRepository.save(cinema);
    }
    
    public void deleteCinema(Long id) {
        Cinema cinema = getCinemaById(id);
        cinemaRepository.delete(cinema);
    }
}
