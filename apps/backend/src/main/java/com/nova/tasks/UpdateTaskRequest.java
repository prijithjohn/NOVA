package com.nova.tasks;

import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;

public record UpdateTaskRequest(
        @Pattern(regexp = ".*\\S.*", message = "Title must not be blank")
        @Size(min = 1, max = 200, message = "Title must be between 1 and 200 characters")
        String title,
        @Size(max = 2000, message = "Description must be 2000 characters or fewer")
        String description,
        Boolean completed) {
}
