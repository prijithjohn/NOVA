package com.nova.tasks;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class TaskService {

    private final TaskRepository taskRepository;

    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    @Transactional(readOnly = true)
    public List<Task> findAll(String statusValue, String search, String sortValue) {
        TaskStatus status = TaskStatus.parse(statusValue);
        TaskSort sort = TaskSort.parse(sortValue);
        Boolean completed = switch (status) {
            case ALL -> null;
            case ACTIVE -> false;
            case COMPLETED -> true;
        };
        String normalizedSearch = search == null ? "" : search.trim();
        String normalizedSort = sort == TaskSort.OLDEST ? "oldest" : "newest";
        return taskRepository.findFiltered(completed, normalizedSearch, normalizedSort);
    }

    public Task create(String title, String description) {
        return taskRepository.save(new Task(title.trim(), normalizeDescription(description)));
    }

    public Task update(UUID id, String title, String description, Boolean completed) {
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
        return taskRepository.save(task);
    }

    public void delete(UUID id) {
        taskRepository.delete(findById(id));
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
}
