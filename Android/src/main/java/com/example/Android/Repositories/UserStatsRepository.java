package com.example.Android.Repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.Android.Models.UserStats;

@Repository
public interface UserStatsRepository extends JpaRepository<UserStats, Long> {
}
