package com.nova.assistant;

import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

@Component
public class AssistantToolRegistry {

    private final Map<String, AssistantTool> tools;

    public AssistantToolRegistry(java.util.List<AssistantTool> tools) {
        this.tools = tools.stream().collect(Collectors.toUnmodifiableMap(AssistantTool::name, Function.identity()));
    }

    public AssistantTool get(String name) {
        AssistantTool tool = tools.get(name);
        if (tool == null) {
            throw new AssistantToolNotFoundException(name);
        }
        return tool;
    }
}
