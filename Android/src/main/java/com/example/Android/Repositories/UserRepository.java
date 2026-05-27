package com.example.Android.Repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import com.example.Android.Models.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    public Optional<User> findUserByEmail(String email);

    public Optional<User> findUserByRole(String role);

    public Optional<User> findUserById(Long id);

    public List<User> findAll();

    @Query("SELECT COUNT(u) FROM User u WHERE UPPER(u.status) = 'ACTIVE'")
    long countActiveUsers();
}
