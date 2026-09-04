package com.nova.assistant;

import com.nova.tasks.CreateTaskRequest;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AssistantActionRequest(
        @NotBlank(message = "Action is required")
        String action,
        @NotBlank(message = "Tool is required")
        String tool,
        @NotBlank(message = "Idempotency key is required")
        @Size(max = 200, message = "Idempotency key must be 200 characters or fewer")
        String idempotencyKey,
        @NotNull(message = "Input is required")
        @Valid CreateTaskRequest input) {
}
