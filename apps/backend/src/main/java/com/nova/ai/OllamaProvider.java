package com.nova.ai;

import java.net.ConnectException;
import java.net.SocketTimeoutException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * AI provider implementation backed by a locally running Ollama instance.
 *
 * <p>Base URL and model are configured exclusively through environment variables:
 * {@code OLLAMA_BASE_URL} (default: {@code http://localhost:11434}) and
 * {@code OLLAMA_MODEL} (default: {@code llama3}).
 *
 * <p>This class must not inject or access any JPA repositories, entities,
 * domain services, or the database.
 */
@Component
public class OllamaProvider implements AIProvider {

    private final RestClient restClient;
    private final String model;
    private final ObjectMapper objectMapper;

    public OllamaProvider(
            @Value("${nova.ai.ollama.base-url}") String baseUrl,
            @Value("${nova.ai.ollama.model}") String model,
            RestClient.Builder restClientBuilder) {
        this.model = model;
        this.objectMapper = new ObjectMapper();
        this.restClient = restClientBuilder
                .baseUrl(baseUrl)
                .build();
    }

    @Override
    public String chat(String userMessage) {
        String requestBody = buildRequestBody(userMessage);

        String rawResponse;
        try {
            rawResponse = restClient.post()
                    .uri("/api/generate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);
        } catch (ResourceAccessException ex) {
            Throwable cause = ex.getCause();
            if (cause instanceof ConnectException || cause instanceof SocketTimeoutException) {
                throw new AIProviderException("Provider unavailable", ex);
            }
            throw new AIProviderException("Provider unavailable", ex);
        } catch (Exception ex) {
            throw new AIProviderException("Provider unavailable", ex);
        }

        return parseResponse(rawResponse);
    }

    private String buildRequestBody(String userMessage) {
        try {
            var node = objectMapper.createObjectNode();
            node.put("model", model);
            node.put("prompt", userMessage);
            node.put("stream", false);
            return objectMapper.writeValueAsString(node);
        } catch (JacksonException ex) {
            throw new AIProviderException("Failed to build provider request", ex);
        }
    }

    private String parseResponse(String rawResponse) {
        if (rawResponse == null || rawResponse.isBlank()) {
            throw new AIProviderException("Invalid provider response");
        }

        // Ollama /api/generate with stream:false returns a single JSON object.
        try {
            JsonNode root = objectMapper.readTree(rawResponse.trim());
            JsonNode responseField = root.get("response");
            if (responseField == null || responseField.isNull()) {
                throw new AIProviderException("Invalid provider response");
            }
            String reply = responseField.asText().strip();
            if (reply.isEmpty()) {
                throw new AIProviderException("Invalid provider response");
            }
            return reply;
        } catch (JacksonException ex) {
            throw new AIProviderException("Invalid provider response", ex);
        }
    }
}
