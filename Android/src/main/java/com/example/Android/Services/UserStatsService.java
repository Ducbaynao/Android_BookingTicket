package com.example.Android.Services;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.Android.Models.UserStats;
import com.example.Android.Repositories.UserRepository;
import com.example.Android.Repositories.UserStatsRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserStatsService {
    private static final Long SINGLE_STATS_KEY = 1L;

    private final UserStatsRepository userStatsRepository;
    private final UserRepository userRepository;

    @Transactional
    public UserStats ensureStatsRow() {
        return userStatsRepository.findById(SINGLE_STATS_KEY)
                .orElseGet(() -> userStatsRepository.save(UserStats.builder()
                        .statsKey(SINGLE_STATS_KEY)
                        .totalUsersHistorical(userRepository.count())
                        .activeUsersCurrent(userRepository.countActiveUsers())
                        .deletedUsersCount(0L)
                        .build()));
    }

    @Transactional
    public void onUserCreated() {
        UserStats stats = ensureStatsRow();
        stats.setTotalUsersHistorical(stats.getTotalUsersHistorical() + 1);
        stats.setActiveUsersCurrent(stats.getActiveUsersCurrent() + 1);
        userStatsRepository.save(stats);
    }

    @Transactional
    public void onUserDeleted(boolean wasActive) {
        UserStats stats = ensureStatsRow();
        if (wasActive && stats.getActiveUsersCurrent() > 0) {
            stats.setActiveUsersCurrent(stats.getActiveUsersCurrent() - 1);
        }
        stats.setDeletedUsersCount(stats.getDeletedUsersCount() + 1);
        userStatsRepository.save(stats);
    }

    @Transactional(readOnly = true)
    public long getHistoricalUsersTotal() {
        return userStatsRepository.findById(SINGLE_STATS_KEY)
                .orElseGet(() -> UserStats.builder()
                        .statsKey(SINGLE_STATS_KEY)
                        .totalUsersHistorical(userRepository.count())
                        .activeUsersCurrent(userRepository.countActiveUsers())
                        .deletedUsersCount(0L)
                        .build())
                .getTotalUsersHistorical();
    }

    @Transactional(readOnly = true)
    public long getActiveUsersCurrent() {
        return userStatsRepository.findById(SINGLE_STATS_KEY)
                .orElseGet(() -> UserStats.builder()
                        .statsKey(SINGLE_STATS_KEY)
                        .totalUsersHistorical(userRepository.count())
                        .activeUsersCurrent(userRepository.countActiveUsers())
                        .deletedUsersCount(0L)
                        .build())
                .getActiveUsersCurrent();
    }
}
