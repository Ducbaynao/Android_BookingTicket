package com.example.Android.common.event;

public interface EventListener<T extends DomainEvent> {
    void handle(T event);
}
