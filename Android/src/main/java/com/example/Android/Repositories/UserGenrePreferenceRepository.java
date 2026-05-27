package com.example.Android.Repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.Android.Models.User;
import com.example.Android.Models.UserGenrePreference;

@Repository
public interface UserGenrePreferenceRepository extends JpaRepository<UserGenrePreference, Long> {
    List<UserGenrePreference> findByUser(User user);

    void deleteByUser(User user);
}
