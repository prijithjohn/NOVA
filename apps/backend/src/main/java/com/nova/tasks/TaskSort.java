package com.nova.tasks;

import java.util.Locale;

public enum TaskSort {
    NEWEST,
    OLDEST;

    public static TaskSort parse(String value) {
        try {
            return valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Invalid task sort: " + value, exception);
        }
    }
}
