package com.nova.tasks;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TaskRepository extends JpaRepository<Task, UUID> {

        @Query("""
            SELECT task FROM Task task
            WHERE (:completed IS NULL OR task.completed = :completed)
                            AND (:priority IS NULL OR task.priority = :priority)
              AND (:search = '' OR LOWER(task.title) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(COALESCE(task.description, '')) LIKE LOWER(CONCAT('%', :search, '%')))
            ORDER BY CASE WHEN :sort = 'oldest' THEN task.createdAt END ASC,
                 CASE WHEN :sort <> 'oldest' THEN task.createdAt END DESC
            """)
        List<Task> findFiltered(
            @Param("completed") Boolean completed,
            @Param("priority") TaskPriority priority,
            @Param("search") String search,
            @Param("sort") String sort);
}
