package com.nova;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.mockito.BDDMockito.given;

import java.util.UUID;

import com.nova.ai.AIProvider;
import com.nova.ai.AIProviderException;
import com.nova.memories.MemoryRepository;
import com.nova.tasks.Task;
import com.nova.tasks.TaskPriority;
import com.nova.tasks.TaskRepository;
import com.nova.assistant.AssistantActionExecutionRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class NovaApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private AssistantActionExecutionRepository assistantActionExecutionRepository;

    @Autowired
    private MemoryRepository memoryRepository;

    @MockitoBean
    private AIProvider aiProvider;

    @BeforeEach
    void clearDatabase() {
        memoryRepository.deleteAll();
        assistantActionExecutionRepository.deleteAll();
        taskRepository.deleteAll();
    }

    @Test
    void assistantCreateTaskActionReturnsStructuredResult() throws Exception {
        mockMvc.perform(post("/api/assistant/actions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "action":"create_task",
                                  "tool":"create_task",
                                  "idempotencyKey":"assistant-test-1",
                                  "input":{"title":"Assistant task","description":"Created by a tool","priority":"HIGH"}
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.action").value("create_task"))
                .andExpect(jsonPath("$.tool").value("create_task"))
                .andExpect(jsonPath("$.status").value("completed"))
                .andExpect(jsonPath("$.replayed").value(false))
                .andExpect(jsonPath("$.result.title").value("Assistant task"))
                .andExpect(jsonPath("$.result.priority").value("HIGH"));
    }

    @Test
    void assistantActionIsIdempotent() throws Exception {
        String request = """
                {
                  "action":"create_task",
                  "tool":"create_task",
                  "idempotencyKey":"assistant-repeat-1",
                  "input":{"title":"Only once","description":"Retry me","priority":"MEDIUM"}
                }
                """;

        String firstId = mockMvc.perform(post("/api/assistant/actions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.replayed").value(false))
                .andReturn().getResponse().getContentAsString()
                .replaceAll(".*\\\"id\\\":\\\"([^\\\"]+)\\\".*", "$1");

        mockMvc.perform(post("/api/assistant/actions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.replayed").value(true))
                .andExpect(jsonPath("$.result.id").value(firstId));

        org.junit.jupiter.api.Assertions.assertEquals(1, taskRepository.count());

        mockMvc.perform(delete("/api/tasks/" + firstId))
                .andExpect(status().isNoContent());
    }

    @Test
    void assistantRejectsInvalidActionToolAndInput() throws Exception {
        mockMvc.perform(post("/api/assistant/actions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"delete_task\",\"tool\":\"create_task\",\"idempotencyKey\":\"bad-action\",\"input\":{\"title\":\"Task\"}}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/assistant/actions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"create_task\",\"tool\":\"missing_tool\",\"idempotencyKey\":\"bad-tool\",\"input\":{\"title\":\"Task\"}}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/assistant/actions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"create_task\",\"tool\":\"create_task\",\"idempotencyKey\":\"bad-input\",\"input\":{\"title\":\"   \"}}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Title is required"));
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

    @Test
    void memoryCreationAndRetrievalSucceeds() throws Exception {
        mockMvc.perform(post("/api/memories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"User prefers concise answers.\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.content").value("User prefers concise answers."))
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.updatedAt").isNotEmpty());

        mockMvc.perform(get("/api/memories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].content").value("User prefers concise answers."));
    }

    @Test
    void memoryValidationRejectsBlankContent() throws Exception {
        mockMvc.perform(post("/api/memories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"   \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Content is required"));

        mockMvc.perform(post("/api/memories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Content is required"));
    }

    @Test
    void memoryDeletionSucceeds() throws Exception {
        String response = mockMvc.perform(post("/api/memories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"Temporary memory.\"}"))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        String id = response.replaceAll(".*\\\"id\\\":\\\"([^\\\"]+)\\\".*", "$1");

        mockMvc.perform(delete("/api/memories/" + id))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/memories"))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }

    @Test
    void missingMemoryReturns404() throws Exception {
        UUID missingId = UUID.randomUUID();
        mockMvc.perform(delete("/api/memories/" + missingId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Memory not found: " + missingId));
    }

    @Test
    void assistantChatRejectsBlankMessage() throws Exception {
        mockMvc.perform(post("/api/assistant/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"   \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Message is required"));

        mockMvc.perform(post("/api/assistant/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Message is required"));
    }

    @Test
    void assistantChatReturns502WhenProviderUnavailable() throws Exception {
        given(aiProvider.decide("hello")).willThrow(new AIProviderException("Provider unavailable"));

        mockMvc.perform(post("/api/assistant/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"hello\"}"))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.error").value("Provider unavailable"));
    }

    @Test
    void assistantChatExecutesCreateTaskActionAndPersistsTask() throws Exception {
        given(aiProvider.decide("Create a task to apply for jobs"))
                .willReturn(new AIProvider.AssistantDecision(
                        "create_task",
                        java.util.Map.of("title", "Apply for jobs", "description", "Backend positions", "priority", "HIGH"),
                        "Task created successfully."));

        mockMvc.perform(post("/api/assistant/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"Create a task to apply for jobs\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.action").value("create_task"))
                .andExpect(jsonPath("$.reply").value("Task created successfully."))
                .andExpect(jsonPath("$.task.title").value("Apply for jobs"))
                .andExpect(jsonPath("$.task.priority").value("HIGH"));

        org.junit.jupiter.api.Assertions.assertEquals(1, taskRepository.count());
        org.junit.jupiter.api.Assertions.assertEquals("Apply for jobs", taskRepository.findAll().get(0).getTitle());
    }

    @Test
    void assistantChatActionNoneDoesNotMutateDatabase() throws Exception {
        given(aiProvider.decide("What is NOVA?"))
                .willReturn(new AIProvider.AssistantDecision(
                        "none",
                        java.util.Map.of(),
                        "NOVA is your personal AI operating system."));

        mockMvc.perform(post("/api/assistant/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"What is NOVA?\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.action").value("none"))
                .andExpect(jsonPath("$.reply").value("NOVA is your personal AI operating system."));

        org.junit.jupiter.api.Assertions.assertEquals(0, taskRepository.count());
    }

    @Test
    void assistantChatUnknownActionIsRejectedSafely() throws Exception {
        given(aiProvider.decide("Drop database"))
                .willReturn(new AIProvider.AssistantDecision(
                        "unsupported_action",
                        java.util.Map.of(),
                        "I cannot do that."));

        mockMvc.perform(post("/api/assistant/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"Drop database\"}"))
                .andExpect(status().isBadRequest());

        org.junit.jupiter.api.Assertions.assertEquals(0, taskRepository.count());
    }

    @Test
    void assistantChatInvalidTaskPriorityIsRejectedSafely() throws Exception {
        given(aiProvider.decide("Create task with bad priority"))
                .willReturn(new AIProvider.AssistantDecision(
                        "create_task",
                        java.util.Map.of("title", "Bad priority task", "priority", "URGENT"),
                        "Attempting creation"));

        mockMvc.perform(post("/api/assistant/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"Create task with bad priority\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid task priority proposed by AI: URGENT"));

        org.junit.jupiter.api.Assertions.assertEquals(0, taskRepository.count());
    }
}

