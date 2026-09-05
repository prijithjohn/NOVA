package com.nova.memories;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class MemoryService {

    private final MemoryRepository memoryRepository;

    public MemoryService(MemoryRepository memoryRepository) {
        this.memoryRepository = memoryRepository;
    }

    @Transactional(readOnly = true)
    public List<Memory> findAll() {
        return memoryRepository.findAllByOrderByCreatedAtDesc();
    }

    public Memory create(String content) {
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("Content is required");
        }
        return memoryRepository.save(new Memory(content.trim()));
    }

    public void delete(UUID id) {
        Memory memory = memoryRepository.findById(id)
                .orElseThrow(() -> new MemoryNotFoundException(id));
        memoryRepository.delete(memory);
    }
}
