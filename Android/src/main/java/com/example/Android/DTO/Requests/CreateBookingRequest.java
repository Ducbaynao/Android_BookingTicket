package com.example.Android.DTO.Requests;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateBookingRequest {
    private Long showtimeId;
    private List<Long> showtimeSeatIds;
    private Double totalAmount;
    private List<ComboSelection> combos;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ComboSelection {
        private Long comboId;
        private Integer quantity;
    }
}
