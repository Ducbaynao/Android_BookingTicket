package com.example.Android.common.event;

import java.time.LocalDateTime;

public abstract class DomainEvent {

    private final String aggregateId;
    private final LocalDateTime occurredAt;

    protected DomainEvent(String aggregateId) {
        this.aggregateId = aggregateId;
        this.occurredAt = LocalDateTime.now();
    }

    public String getAggregateId() {
        return aggregateId;
    }

    public LocalDateTime getOccurredAt() {
        return occurredAt;
    }
}
