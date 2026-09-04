package com.nova.tasks;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.nova.assistant.AssistantActionExecution;
import com.nova.assistant.AssistantActionExecutionRepository;

@Service
@Transactional
public class TaskService {

    private final TaskRepository taskRepository;
    private final AssistantActionExecutionRepository assistantActionExecutionRepository;

    public TaskService(
            TaskRepository taskRepository,
            AssistantActionExecutionRepository assistantActionExecutionRepository) {
        this.taskRepository = taskRepository;
        this.assistantActionExecutionRepository = assistantActionExecutionRepository;
    }

    public IdempotentTaskResult createIdempotent(
            String idempotencyKey,
            String title,
            String description,
            String priorityValue) {
        var existing = assistantActionExecutionRepository.findByIdempotencyKey(idempotencyKey);
        if (existing.isPresent()) {
            return new IdempotentTaskResult(
                    TaskResponse.from(findById(existing.get().getTaskId())),
                    true);
        }

        Task task = create(title, description, priorityValue);
        assistantActionExecutionRepository.save(new AssistantActionExecution(idempotencyKey, task.getId()));
        return new IdempotentTaskResult(TaskResponse.from(task), false);
    }

    @Transactional(readOnly = true)
    public List<Task> findAll(String statusValue, String priorityValue, String search, String sortValue) {
        TaskStatus status = TaskStatus.parse(statusValue);
        TaskPriority priority = "all".equalsIgnoreCase(priorityValue)
            ? null
            : TaskPriority.parse(priorityValue);
        TaskSort sort = TaskSort.parse(sortValue);
        Boolean completed = switch (status) {
            case ALL -> null;
            case ACTIVE -> false;
            case COMPLETED -> true;
        };
        String normalizedSearch = search == null ? "" : search.trim();
        String normalizedSort = sort == TaskSort.OLDEST ? "oldest" : "newest";
        return taskRepository.findFiltered(completed, priority, normalizedSearch, normalizedSort);
    }

    public Task create(String title, String description, String priorityValue) {
        TaskPriority priority = priorityValue == null || priorityValue.isBlank()
                ? TaskPriority.MEDIUM
                : TaskPriority.parse(priorityValue);
        return taskRepository.save(new Task(title.trim(), normalizeDescription(description), priority));
    }

    public Task update(UUID id, String title, String description, Boolean completed, String priorityValue) {
        Task task = findById(id);
        if (title != null) {
            task.setTitle(title.trim());
        }
        if (description != null) {
            task.setDescription(normalizeDescription(description));
        }
        if (completed != null) {
            task.setCompleted(completed);
        }
        if (priorityValue != null) {
            task.setPriority(TaskPriority.parse(priorityValue));
        }
        return taskRepository.save(task);
    }

    public void delete(UUID id) {
        Task task = findById(id);
        assistantActionExecutionRepository.deleteByTaskId(task.getId());
        taskRepository.delete(task);
    }

    private Task findById(UUID id) {
        return taskRepository.findById(id).orElseThrow(() -> new TaskNotFoundException(id));
    }

    private String normalizeDescription(String description) {
        if (description == null) {
            return null;
        }
        String normalized = description.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    public record IdempotentTaskResult(TaskResponse task, boolean replayed) {
    }
}
