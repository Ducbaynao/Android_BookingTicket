package com.example.Android.DTO.Requests;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RegsiterRequest {
    private String name;
    private String email;
    private String password;
}
