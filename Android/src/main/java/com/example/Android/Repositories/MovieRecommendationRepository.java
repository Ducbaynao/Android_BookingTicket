package com.example.Android.Repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.Android.Models.User;
import com.example.Android.userinteraction.entity.MovieRecommendation;

@Repository
public interface MovieRecommendationRepository extends JpaRepository<MovieRecommendation, Long> {
    List<MovieRecommendation> findByUserOrderByScoreDesc(User user);

    void deleteByUser(User user);
}
