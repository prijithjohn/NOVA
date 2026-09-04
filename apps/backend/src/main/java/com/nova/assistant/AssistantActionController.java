package com.nova.assistant;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/assistant/actions")
public class AssistantActionController {

    private final AssistantToolRegistry toolRegistry;

    public AssistantActionController(AssistantToolRegistry toolRegistry) {
        this.toolRegistry = toolRegistry;
    }

    @PostMapping
    public ResponseEntity<AssistantActionResponse> execute(@Valid @RequestBody AssistantActionRequest request) {
        if (!"create_task".equals(request.action())) {
            throw new AssistantActionNotSupportedException(request.action());
        }
        return ResponseEntity.ok(toolRegistry.get(request.tool()).execute(request));
    }
}
