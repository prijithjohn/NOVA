package com.nova.assistant;

public class AssistantActionNotSupportedException extends RuntimeException {

    public AssistantActionNotSupportedException(String action) {
        super("Assistant action not supported: " + action);
    }
}
