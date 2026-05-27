package com.example.Android.Services;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.Android.Models.Room;
import com.example.Android.Repositories.RoomRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RoomService {

    RoomRepository roomRepository;

    public List<Room> getRoomsByCinema(Long cinemaId) {
        return roomRepository.findByCinemaId(cinemaId);
    }
}
