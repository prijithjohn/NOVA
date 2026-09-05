package com.nova.memories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface MemoryRepository extends JpaRepository<Memory, UUID> {

    @Query("SELECT m FROM Memory m ORDER BY m.createdAt DESC")
    List<Memory> findAllByOrderByCreatedAtDesc();
}
