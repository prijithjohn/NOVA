package com.nova.assistant;

import com.nova.tasks.TaskResponse;

public record AssistantActionResponse(
        String action,
        String tool,
        String idempotencyKey,
        String status,
        boolean replayed,
        TaskResponse result) {
}
