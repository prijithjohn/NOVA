package com.nova.ai;

/**
 * Contract for AI language model providers.
 *
 * <p>Implementations must be stateless and must not access the database,
 * JPA repositories, or any domain services directly.
 */
public interface AIProvider {

    /**
     * Send a single user message to the provider and return the text reply.
     *
     * @param userMessage the message to send; must not be blank
     * @return the provider's text reply
     * @throws AIProviderException if the provider is unavailable, times out, or
     *                             returns an invalid response
     */
    String chat(String userMessage);
}
