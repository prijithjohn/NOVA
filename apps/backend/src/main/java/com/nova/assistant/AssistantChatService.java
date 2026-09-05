package com.nova.assistant;

import com.nova.ai.AIProvider;
import org.springframework.stereotype.Service;

/**
 * Service layer for AI chat interactions.
 *
 * <p>Delegates to the configured {@link AIProvider}. This service must not
 * access JPA repositories, entities, or any domain service other than AIProvider.
 */
@Service
public class AssistantChatService {

    private final AIProvider aiProvider;

    public AssistantChatService(AIProvider aiProvider) {
        this.aiProvider = aiProvider;
    }

    /**
     * Send a user message to the AI provider and return the reply.
     *
     * @param message the user message; must not be blank
     * @return the provider's text reply
     */
    public String chat(String message) {
        if (message == null || message.isBlank()) {
            throw new IllegalArgumentException("Message is required");
        }
        return aiProvider.chat(message);
    }
}
