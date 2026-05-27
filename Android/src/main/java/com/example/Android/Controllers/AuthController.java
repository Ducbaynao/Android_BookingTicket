package com.example.Android.Controllers;

import com.example.Android.DTO.Requests.AuthRequest;
import com.example.Android.DTO.Requests.RegsiterRequest;
import com.example.Android.DTO.Responses.LoginResponse;
import com.example.Android.DTO.Responses.RegisterResponse;
import com.example.Android.DTO.Responses.UserResponse;
import com.example.Android.Services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserService userService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest authRequest) {
        try {
            LoginResponse loginResponse = userService.login(authRequest);
            return ResponseEntity.ok(loginResponse);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(401).body(error);
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegsiterRequest request) {
        try {
            RegisterResponse registerResponse = userService.registerUser(request);
            return ResponseEntity.ok(registerResponse);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(401).build();
        }
        UserResponse user = userService.getUserProfileByEmail(authentication.getName());
        return ResponseEntity.ok(user);
    }
}
