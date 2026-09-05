package com.nova.memories;

import java.time.Instant;
import java.util.UUID;

public record MemoryResponse(
        UUID id,
        String content,
        Instant createdAt,
        Instant updatedAt) {

    public static MemoryResponse from(Memory memory) {
        return new MemoryResponse(
                memory.getId(),
                memory.getContent(),
                memory.getCreatedAt(),
                memory.getUpdatedAt());
    }
}
