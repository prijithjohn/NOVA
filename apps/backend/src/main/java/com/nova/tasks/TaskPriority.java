package com.nova.tasks;

import java.util.Locale;

public enum TaskPriority {
    LOW,
    MEDIUM,
    HIGH;

    public static TaskPriority parse(String value) {
        try {
            return valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Invalid task priority: " + value, exception);
        }
    }
}
