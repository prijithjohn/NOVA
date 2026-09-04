package com.nova.assistant;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AssistantActionExecutionRepository extends JpaRepository<AssistantActionExecution, java.util.UUID> {

    Optional<AssistantActionExecution> findByIdempotencyKey(String idempotencyKey);

    void deleteByTaskId(UUID taskId);
}
