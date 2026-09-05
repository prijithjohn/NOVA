package com.nova.assistant;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

/**
 * REST endpoint for AI chat.
 *
 * <p>This endpoint is read-only: it does not execute tools, create tasks,
 * mutate memories, or interact with any database entity.
 */
@RestController
@RequestMapping("/api/assistant")
public class AssistantChatController {

    private final AssistantChatService assistantChatService;

    public AssistantChatController(AssistantChatService assistantChatService) {
        this.assistantChatService = assistantChatService;
    }

    /**
     * Send a user message to the configured AI provider and return the reply.
     *
     * @param request must contain a non-blank {@code message}
     * @return {@code {"reply": "..."}} on success
     */
    @PostMapping("/chat")
    public ResponseEntity<AssistantChatResponse> chat(@Valid @RequestBody AssistantChatRequest request) {
        AssistantChatResponse response = assistantChatService.chat(request.message());
        return ResponseEntity.ok(response);
    }

}
