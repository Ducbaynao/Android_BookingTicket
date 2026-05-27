package com.example.Android.DTO.Responses;

import java.util.List;

import com.example.Android.Models.Genre;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;

@SuperBuilder
@Data
@EqualsAndHashCode(callSuper = true)
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class GenresResponse extends BaseResponse {
    List<Genre> genres;
}
