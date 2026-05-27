package com.example.Android.Services;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Optional;

import com.example.Android.DTO.Requests.AuthRequest;
import com.example.Android.DTO.Requests.RegsiterRequest;
import com.example.Android.DTO.Responses.LoginResponse;
import com.example.Android.DTO.Responses.RegisterResponse;
import com.example.Android.DTO.Responses.UserResponse;
import com.example.Android.Models.User;
import com.example.Android.Repositories.UserRepository;
import com.example.Android.Utils.JwtUtils;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class UserService {
    UserRepository userRepository;
    PasswordEncoder passwordEncoder;
    JwtUtils jwtUtils;
    UserStatsService userStatsService;

    public RegisterResponse registerUser(RegsiterRequest request) {
        log.info("Starting user registration for email: {}", request.getEmail());
        
        userRepository.findUserByEmail(request.getEmail()).ifPresent(u -> {
            log.warn("Registration failed - email already exists: {}", request.getEmail());
            throw new RuntimeException("Email is already in use");
        });

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role("USER")
                .status("ACTIVE")
                .build();
        
        User savedUser = userRepository.save(user);
        userStatsService.onUserCreated();
        log.info("User registered successfully with ID: {} for email: {}", savedUser.getId(), request.getEmail());
        
        return RegisterResponse.builder()
                .id(savedUser.getId())
                .name(savedUser.getName())
                .email(savedUser.getEmail())
                .message("User registered successfully")
                .build();
    }

    public LoginResponse login(AuthRequest request) {
        log.info("Starting login process for email: {}", request.getEmail());
        
        User user = userRepository.findUserByEmail(request.getEmail())
                .orElseThrow(() -> {
                    log.warn("Login failed - user not found: {}", request.getEmail());
                    return new RuntimeException("Invalid credentials");
                });
        
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            log.warn("Login failed - incorrect password for email: {}", request.getEmail());
            throw new RuntimeException("Password is incorrect");
        }
        
        String token = jwtUtils.generateToken(user.getEmail());
        log.info("JWT token generated for user: {}", request.getEmail());
        
        UserResponse userResponse = toUserResponse(user);
        
        return LoginResponse.builder()
                .token(token)
                .user(userResponse)
                .build();
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findUserById(id);
    }

    public User findByEmail(String email) {
        return userRepository.findUserByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
    }

    public UserResponse getUserProfileByEmail(String email) {
        User user = findByEmail(email);
        return toUserResponse(user);
    }

    private UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .totalSpending(user.getTotalSpending())
                .loyaltyPoints(user.getLoyaltyPoints())
                .loyaltyTier(user.getLoyaltyTier())
                .tierUpdatedAt(user.getTierUpdatedAt())
                .build();
    }
}
