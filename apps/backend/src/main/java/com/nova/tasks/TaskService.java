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
    public List<Task> findAll() {
        return taskRepository.findAllByOrderByCreatedAtDesc();
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
