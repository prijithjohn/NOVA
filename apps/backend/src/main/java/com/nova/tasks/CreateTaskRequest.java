package com.nova.tasks;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateTaskRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 200, message = "Title must be 200 characters or fewer")
        String title,
        @Size(max = 2000, message = "Description must be 2000 characters or fewer")
        String description,
        @Size(max = 10, message = "Priority must be LOW, MEDIUM, or HIGH")
        String priority) {
}
