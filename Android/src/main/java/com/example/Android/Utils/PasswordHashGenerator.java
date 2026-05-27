package com.example.Android.Utils;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordHashGenerator {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        
        // Hash password "12345"
        String rawPassword = "12345";
        String hashedPassword = encoder.encode(rawPassword);
        
        System.out.println("Raw Password: " + rawPassword);
        System.out.println("Hashed Password: " + hashedPassword);
        System.out.println("\nSQL Query:");
        System.out.println("UPDATE users SET password_hash = '" + hashedPassword + "' WHERE email = 'madung1409@gmail.com';");
    }
}