package com.example.Android.DTO.Requests;

import java.util.List;
import com.example.Android.Models.Genre;

import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class GenresSelectReq {
    List<Genre> genres;
}
