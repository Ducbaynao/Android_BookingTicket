package com.example.Android.shared.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;


// Global exception handler to catch and handle exceptions across the application
@ControllerAdvice
public class GlobalExceptionHandler {
 
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<String> HandleRuntimeEception(RuntimeException ex) {
        // Handle the exception and return an appropriate response
        String errorMessage = ex.getMessage();
        return ResponseEntity.status(500).body(errorMessage);

    }

    @ExceptionHandler(JwtException.class)
    public ResponseEntity<String> handleJwtException(JwtException ex) {
        String errorMessage = "Invalid JWT token: " + ex.getMessage();
        return ResponseEntity.status(401).body(errorMessage);
    }
}
