package com.nova.assistant;

public interface AssistantTool {

    String name();

    AssistantActionResponse execute(AssistantActionRequest request);
}
