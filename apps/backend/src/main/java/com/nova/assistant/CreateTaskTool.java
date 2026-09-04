package com.nova.assistant;

import com.nova.tasks.TaskService;

import org.springframework.stereotype.Component;

@Component
public class CreateTaskTool implements AssistantTool {

    private static final String NAME = "create_task";

    private final TaskService taskService;

    public CreateTaskTool(TaskService taskService) {
        this.taskService = taskService;
    }

    @Override
    public String name() {
        return NAME;
    }

    @Override
    public AssistantActionResponse execute(AssistantActionRequest request) {
        TaskService.IdempotentTaskResult result = taskService.createIdempotent(
                request.idempotencyKey(),
                request.input().title(),
                request.input().description(),
                request.input().priority());
        return new AssistantActionResponse(
                request.action(),
                NAME,
                request.idempotencyKey(),
                "completed",
                result.replayed(),
                result.task());
    }
}
