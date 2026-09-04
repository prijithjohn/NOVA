package com.nova;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import com.nova.tasks.Task;
import com.nova.tasks.TaskPriority;
import com.nova.tasks.TaskRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class NovaApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TaskRepository taskRepository;

    @BeforeEach
    void clearTasks() {
        taskRepository.deleteAll();
    }

    @Test
    void healthEndpointReturnsBackendStatus() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(content().json("{\"status\":\"ok\",\"service\":\"backend\"}"));
    }

    @Test
    void taskCrudPersistsAndReturnsDtoData() throws Exception {
        String createResponse = mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Plan the week\",\"description\":\"Review priorities\",\"priority\":\"HIGH\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Plan the week"))
                .andExpect(jsonPath("$.completed").value(false))
                .andExpect(jsonPath("$.priority").value("HIGH"))
                .andReturn()
                .getResponse()
                .getContentAsString();
        String id = createResponse.replaceAll(".*\\\"id\\\":\\\"([^\\\"]+)\\\".*", "$1");

        mockMvc.perform(get("/api/tasks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(id));

        mockMvc.perform(patch("/api/tasks/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"completed\":true,\"priority\":\"LOW\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completed").value(true))
                .andExpect(jsonPath("$.priority").value("LOW"));

        mockMvc.perform(delete("/api/tasks/" + id))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/tasks"))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }

    @Test
    void taskValidationAndNotFoundAreHandled() throws Exception {
        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"   \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Title is required"));

        UUID missingId = UUID.randomUUID();
        mockMvc.perform(patch("/api/tasks/" + missingId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"completed\":true}"))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete("/api/tasks/" + missingId))
                .andExpect(status().isNotFound());
    }

    @Test
    void taskQueriesFilterSearchAndSortInTheDatabase() throws Exception {
        Task first = taskRepository.save(new Task("Plan the week", "Review priorities", TaskPriority.HIGH));
        first.setCompleted(true);
        taskRepository.save(first);
        taskRepository.save(new Task("Buy milk", "Plan dinner", TaskPriority.LOW));

        mockMvc.perform(get("/api/tasks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));

        mockMvc.perform(get("/api/tasks?status=active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Buy milk"));

        mockMvc.perform(get("/api/tasks?status=completed"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Plan the week"));

        mockMvc.perform(get("/api/tasks?priority=high"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Plan the week"));

        mockMvc.perform(get("/api/tasks?priority=low"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Buy milk"));

        mockMvc.perform(get("/api/tasks?search=PLAN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));

        mockMvc.perform(get("/api/tasks?search=PRIORITIES"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Plan the week"));

        mockMvc.perform(get("/api/tasks?status=active&search=plan"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Buy milk"));

        mockMvc.perform(get("/api/tasks?status=active&priority=low&search=plan"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Buy milk"));

        mockMvc.perform(get("/api/tasks?sort=oldest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Plan the week"));

        mockMvc.perform(get("/api/tasks?sort=NEWEST"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Buy milk"));
    }

    @Test
    void invalidTaskQueryValuesReturnBadRequest() throws Exception {
        mockMvc.perform(get("/api/tasks?status=paused"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid task status: paused"));

        mockMvc.perform(get("/api/tasks?sort=random"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid task sort: random"));

        mockMvc.perform(get("/api/tasks?priority=urgent"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid task priority: urgent"));
    }
}
