package com.nova.memories;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/memories")
public class MemoryController {

    private final MemoryService memoryService;

    public MemoryController(MemoryService memoryService) {
        this.memoryService = memoryService;
    }

    @GetMapping
    public List<MemoryResponse> list() {
        return memoryService.findAll().stream().map(MemoryResponse::from).toList();
    }

    @PostMapping
    public ResponseEntity<MemoryResponse> create(@Valid @RequestBody CreateMemoryRequest request) {
        Memory memory = memoryService.create(request.content());
        return ResponseEntity.created(URI.create("/api/memories/" + memory.getId()))
                .body(MemoryResponse.from(memory));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        memoryService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
