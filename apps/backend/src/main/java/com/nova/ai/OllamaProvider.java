package com.nova.ai;

import java.net.ConnectException;
import java.net.SocketTimeoutException;
import java.util.HashMap;
import java.util.Map;

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

    private static final String SYSTEM_PROMPT = """
            You are the NOVA AI Assistant decision engine.
            Analyze the user request and choose an action:
            1. "create_task": Use when the user explicitly requests to create, add, or remember a task or to-do.
               Required arguments:
               - "title": (string) concise task title.
               Optional arguments:
               - "description": (string) optional task description.
               - "priority": (string) "LOW", "MEDIUM", or "HIGH". Default to "MEDIUM" if unspecified.
            2. "none": Use for general questions, greetings, or when no task creation is requested.
               Arguments: {}

            You MUST respond ONLY with a single JSON object matching this exact structure:
            {
              "action": "create_task" | "none",
              "arguments": { ... },
              "reply": "Conversational reply to the user"
            }
            Do not include any text, markdown code blocks, or commentary outside the JSON object.
            """;

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

    @Override
    public AssistantDecision decide(String userMessage) {
        String rawResponse;
        try {
            var node = objectMapper.createObjectNode();
            node.put("model", model);
            node.put("system", SYSTEM_PROMPT);
            node.put("prompt", userMessage);
            node.put("format", "json");
            node.put("stream", false);
            String requestBody = objectMapper.writeValueAsString(node);

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
        } catch (JacksonException ex) {
            throw new AIProviderException("Failed to build provider request", ex);
        } catch (Exception ex) {
            throw new AIProviderException("Provider unavailable", ex);
        }

        return parseDecisionResponse(rawResponse);
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

    private AssistantDecision parseDecisionResponse(String rawResponse) {
        if (rawResponse == null || rawResponse.isBlank()) {
            throw new AIProviderException("Invalid provider response");
        }

        try {
            JsonNode root = objectMapper.readTree(rawResponse.trim());
            JsonNode responseField = root.get("response");
            if (responseField == null || responseField.isNull()) {
                throw new AIProviderException("Invalid provider response");
            }
            String jsonContent = responseField.asText().strip();
            if (jsonContent.isEmpty()) {
                throw new AIProviderException("Invalid provider response");
            }

            JsonNode decisionNode = objectMapper.readTree(jsonContent);
            JsonNode actionNode = decisionNode.get("action");
            if (actionNode == null || actionNode.isNull()) {
                throw new AIProviderException("Invalid provider response");
            }
            String action = actionNode.asText().strip();

            Map<String, String> arguments = new HashMap<>();
            JsonNode argsNode = decisionNode.get("arguments");
            if (argsNode != null && argsNode.isObject()) {
                argsNode.propertyNames().forEach(name -> {
                    JsonNode val = argsNode.get(name);
                    if (val != null && !val.isNull()) {
                        arguments.put(name, val.asText());
                    }
                });
            }



            JsonNode replyNode = decisionNode.get("reply");
            String reply = (replyNode != null && !replyNode.isNull()) ? replyNode.asText().strip() : null;

            return new AssistantDecision(action, arguments, reply);
        } catch (JacksonException ex) {
            throw new AIProviderException("Invalid provider response", ex);
        }
    }
}

