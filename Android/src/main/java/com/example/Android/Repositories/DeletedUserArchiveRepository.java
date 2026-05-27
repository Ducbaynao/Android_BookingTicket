package com.example.Android.Repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.Android.Models.DeletedUserArchive;

@Repository
public interface DeletedUserArchiveRepository extends JpaRepository<DeletedUserArchive, Long> {
    long countByOriginalUserId(Long originalUserId);
}
