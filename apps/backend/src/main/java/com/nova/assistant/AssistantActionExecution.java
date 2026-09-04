package com.nova.assistant;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "assistant_action_executions")
public class AssistantActionExecution {

    @Id
    private UUID id;

    @Column(name = "idempotency_key", nullable = false, unique = true, length = 200)
    private String idempotencyKey;

    @Column(name = "task_id", nullable = false)
    private UUID taskId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected AssistantActionExecution() {
    }

    public AssistantActionExecution(String idempotencyKey, UUID taskId) {
        this.id = UUID.randomUUID();
        this.idempotencyKey = idempotencyKey;
        this.taskId = taskId;
        this.createdAt = Instant.now();
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public UUID getTaskId() {
        return taskId;
    }
}
