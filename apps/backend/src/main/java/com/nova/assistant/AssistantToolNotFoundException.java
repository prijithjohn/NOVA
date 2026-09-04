package com.nova.assistant;

public class AssistantToolNotFoundException extends RuntimeException {

    public AssistantToolNotFoundException(String name) {
        super("Assistant tool not found: " + name);
    }
}
