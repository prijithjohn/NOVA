package com.nova.ai;

/**
 * Thrown when an AI provider call fails due to unavailability, timeout,
 * or an invalid/unparseable response.
 */
public class AIProviderException extends RuntimeException {

    public AIProviderException(String message) {
        super(message);
    }

    public AIProviderException(String message, Throwable cause) {
        super(message, cause);
    }
}
