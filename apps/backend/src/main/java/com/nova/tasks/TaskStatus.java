package com.nova.tasks;

import java.util.Locale;

public enum TaskStatus {
    ALL,
    ACTIVE,
    COMPLETED;

    public static TaskStatus parse(String value) {
        try {
            return valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Invalid task status: " + value, exception);
        }
    }
}
