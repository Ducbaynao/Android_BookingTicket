package com.example.Android.Repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.Android.Models.Movie;
import com.example.Android.Models.User;
import com.example.Android.userinteraction.entity.WatchHistory;

@Repository
public interface WatchHistoryRepository extends JpaRepository<WatchHistory, Long> {
    List<WatchHistory> findByUserOrderByWatchedAtDesc(User user);

    boolean existsByUserAndMovie(User user, Movie movie);

    void deleteByUser(User user);
}
