package com.nova.assistant;

import java.util.Map;
import java.util.Set;
import java.util.UUID;

import com.nova.ai.AIProvider;
import com.nova.tasks.CreateTaskRequest;
import com.nova.tasks.TaskResponse;

import org.springframework.stereotype.Service;

/**
 * Service layer for AI chat interactions.
 *
 * <p>Delegates structured AI decision making to {@link AIProvider}, then validates
 * proposed actions and routes allowed tool calls to {@link AssistantToolRegistry}.
 */
@Service
public class AssistantChatService {

    private static final Set<String> VALID_PRIORITIES = Set.of("LOW", "MEDIUM", "HIGH");

    private final AIProvider aiProvider;
    private final AssistantToolRegistry toolRegistry;

    public AssistantChatService(AIProvider aiProvider, AssistantToolRegistry toolRegistry) {
        this.aiProvider = aiProvider;
        this.toolRegistry = toolRegistry;
    }

    /**
     * Send a user message to the AI provider, evaluate any proposed structured action,
     * execute validated tools, and return the response.
     *
     * @param message the user message; must not be blank
     * @return the assistant chat response containing reply, action, and optional task result
     */
    public AssistantChatResponse chat(String message) {
        if (message == null || message.isBlank()) {
            throw new IllegalArgumentException("Message is required");
        }

        AIProvider.AssistantDecision decision = aiProvider.decide(message);
        if (decision == null || decision.action() == null) {
            throw new IllegalArgumentException("AI decision output is invalid");
        }

        String action = decision.action().strip();
        Map<String, String> args = decision.arguments() != null ? decision.arguments() : Map.of();

        if ("none".equalsIgnoreCase(action)) {
            String reply = decision.reply() != null && !decision.reply().isBlank()
                    ? decision.reply()
                    : "No action proposed.";
            return new AssistantChatResponse(reply, "none", null);
        }

        if ("create_task".equalsIgnoreCase(action)) {
            String title = args.get("title");
            if (title == null || title.isBlank()) {
                throw new IllegalArgumentException("Proposed task title is required");
            }
            title = title.strip();

            String description = args.getOrDefault("description", "");
            if (description != null) {
                description = description.strip();
            }

            String priority = args.getOrDefault("priority", "MEDIUM");
            if (priority == null || priority.isBlank()) {
                priority = "MEDIUM";
            } else {
                priority = priority.strip().toUpperCase();
            }

            if (!VALID_PRIORITIES.contains(priority)) {
                throw new IllegalArgumentException("Invalid task priority proposed by AI: " + priority);
            }

            String idempotencyKey = "chat-" + UUID.randomUUID();
            CreateTaskRequest createTaskRequest = new CreateTaskRequest(title, description, priority);
            AssistantActionRequest actionRequest = new AssistantActionRequest(
                    "create_task",
                    "create_task",
                    idempotencyKey,
                    createTaskRequest);

            AssistantTool tool = toolRegistry.get("create_task");
            AssistantActionResponse actionResponse = tool.execute(actionRequest);
            TaskResponse task = actionResponse.result();

            String reply = decision.reply() != null && !decision.reply().isBlank()
                    ? decision.reply()
                    : ("Created task: " + task.title());

            return new AssistantChatResponse(reply, "create_task", task);
        }

        throw new AssistantActionNotSupportedException(action);
    }
}


