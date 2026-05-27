package com.example.Android.Services;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class BookingProducer {
    RabbitTemplate rabbitTemplate;

    public void sendBookingMessage(Long bookingId) {
        rabbitTemplate.convertAndSend("bookingExchange", "bookingRoutingKey", bookingId);
    }

}
