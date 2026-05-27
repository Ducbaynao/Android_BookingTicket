package com.example.Android.DTO.Responses;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MoviesListResponse {
    private List<MovieResponse> movies;
    private Integer totalCount;
    private String message;
}