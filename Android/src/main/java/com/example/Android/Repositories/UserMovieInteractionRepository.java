package com.example.Android.Repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.Android.Models.User;
import com.example.Android.userinteraction.entity.UserMovieInteraction;

@Repository
public interface UserMovieInteractionRepository extends JpaRepository<UserMovieInteraction, Long> {
    List<UserMovieInteraction> findByUserOrderByCreatedAtDesc(User user);

    void deleteByUser(User user);
}
