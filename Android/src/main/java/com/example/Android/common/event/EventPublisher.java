package com.example.Android.common.event;

public interface EventPublisher {
    void publish(DomainEvent event);
}
