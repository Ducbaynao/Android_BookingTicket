package com.example.Android.Repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.Android.Models.Combo;

@Repository
public interface ComboRepository extends JpaRepository<Combo, Long> {
}
