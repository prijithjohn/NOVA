package com.nova.tasks;

import java.time.Instant;
import java.util.UUID;

public record TaskResponse(
        UUID id,
        String title,
        String description,
        boolean completed,
        TaskPriority priority,
        Instant createdAt,
        Instant updatedAt) {

    public static TaskResponse from(Task task) {
        return new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.isCompleted(),
                task.getPriority(),
                task.getCreatedAt(),
                task.getUpdatedAt());
    }
}
