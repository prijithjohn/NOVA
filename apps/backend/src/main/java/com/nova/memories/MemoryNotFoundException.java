package com.nova.memories;

import java.util.UUID;

public class MemoryNotFoundException extends RuntimeException {

    public MemoryNotFoundException(UUID id) {
        super("Memory not found: " + id);
    }
}
