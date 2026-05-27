package com.example.Android.DTO.Requests;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthRequest {
    @Email
    private String email;

    @Size(min = 5, message = "Password must be at least {min} characters long")
    private String password;
}
