package com.nova.assistant;

import jakarta.validation.constraints.NotBlank;

public record AssistantChatRequest(
        @NotBlank(message = "Message is required") String message) {
}
