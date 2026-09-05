package com.nova.ai;

import java.util.Map;

/**
 * Contract for AI language model providers.
 *
 * <p>Implementations must be stateless and must not access the database,
 * JPA repositories, or any domain services directly.
 */
public interface AIProvider {

    record AssistantDecision(
            String action,
            Map<String, String> arguments,
            String reply
    ) {}

    /**
     * Send a single user message to the provider and return the text reply.
     *
     * @param userMessage the message to send; must not be blank
     * @return the provider's text reply
     * @throws AIProviderException if the provider is unavailable, times out, or
     *                             returns an invalid response
     */
    String chat(String userMessage);

    /**
     * Analyze a user message and return a structured decision containing an action proposal,
     * arguments, and a conversational reply.
     *
     * @param userMessage the message to analyze; must not be blank
     * @return the structured decision
     * @throws AIProviderException if the provider is unavailable, times out, or
     *                             returns an invalid response
     */
    AssistantDecision decide(String userMessage);
}

