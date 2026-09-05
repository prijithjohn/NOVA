package com.nova.assistant;

import com.nova.tasks.TaskResponse;

public record AssistantChatResponse(
        String reply,
        String action,
        TaskResponse task
) {
    public AssistantChatResponse(String reply) {
        this(reply, "none", (TaskResponse) null);
    }
}


