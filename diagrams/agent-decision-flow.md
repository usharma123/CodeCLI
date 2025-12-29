# Agent Decision Process Flowchart

## Mermaid Source Code

```mermaid
flowchart TD
    START((User Input)) --> HISTORY[Add to Message History]
    
    subgraph PLAN_MODE["Plan Mode Workflow"]
        PLAN_CHECK{Is /plan command?}
        PLAN_CHECK -->|Yes| PLAN_EXPLORE[Explore Codebase]
        PLAN_EXPLORE --> PLAN_GENERATE[Generate Plan with plan_write]
        PLAN_GENERATE --> PLAN_WAIT[Wait for User Approval]
        PLAN_WAIT -->|Approve| PLAN_CONVERT[Convert to Todos]
        PLAN_WAIT -->|Reject| PLAN_CLEAR[Clear Plan]
        PLAN_WAIT -->|Modify| PLAN_EXPLORE
        PLAN_CONVERT --> TODOS[Update Todo State]
    end
    
    PLAN_CHECK -->|No| TODOS_CHECK{Has Todos?}
    TODOS_CHECK -->|Yes| TODO_UPDATE[Update In-Progress Todo]
    TODO_UPDATE --> LLM_SEND
    
    subgraph LLM_LOOP["LLM Decision Loop"]
        LLM_SEND[Send to LLM with Tools & History] --> LLM_DECIDE{LLM Response?}
        
        LLM_DECIDE -->|Tool Calls| TOOL_PREP[Parse & Validate Args]
        TOOL_PREP --> TOOL_VALID{Valid?}
        TOOL_VALID -->|No| TOOL_ERROR[Return Error to LLM]
        TOOL_ERROR --> LLM_SEND
        
        TOOL_VALID -->|Yes| TOOL_EXEC[Execute Tool Function]
        TOOL_EXEC --> TOOL_FORMAT[Format Output]
        TOOL_FORMAT --> TOOL_RESULT[Add Result to History]
        TOOL_RESULT --> LLM_SEND
        
        LLM_DECIDE -->|Direct Response| DISPLAY[Display to User]
    end
    
    subgraph TODO_LOOP["Todo Execution Loop"]
        TODOS --> TODO_CHECK{More Todos?}
        TODO_CHECK -->|Yes| NEXT_TODO[Mark Current Done<br/>Mark Next In-Progress]
        NEXT_TODO --> LLM_SEND
        TODO_CHECK -->|No| COMPLETE((Task Complete))
    end
    
    COMPLETE --> WAIT[(Wait for Next Input)]

    classDef decision fill:#f9f,stroke:#333,stroke-width:2px
    classDef process fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
    classDef startend fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    classDef data fill:#fff3e0,stroke:#e65100,stroke-width:2px
    
    class LLM_DECIDE,TODOS_CHECK,TODO_CHECK,PLAN_CHECK,TOOL_VALID decision
    class LLM_SEND,TOOL_EXEC,TOOL_FORMAT,DISPLAY,PLAN_EXPLORE,PLAN_GENERATE,PLAN_CONVERT process
    class START,COMPLETE startend
    class HISTORY,TODOS,TODO_UPDATE data
```

## Component Breakdown

### 1. User Input → Message History
When user input is received, it's added to the conversation history for context.

### 2. Plan Mode Detection
- **Check for `/plan` command**: If user wants to create an implementation plan
- **Explore codebase**: Gather context about the project
- **Generate plan**: Create structured plan with `plan_write` tool
- **Wait for approval**: User can approve, reject, or request modifications
- **Convert to todos**: Approved plans become todo items

### 3. Todo State Management
- **Check for existing todos**: If tasks are pending
- **Update in-progress todo**: Track which task is being worked on
- **Todo loop**: Continue executing until all todos are complete

### 4. LLM Decision Loop (Core Agent Logic)
The agent repeatedly:
1. **Sends to LLM**: User message + history + available tools
2. **LLM decides**: Either make tool calls OR respond directly
3. **If tool calls**:
   - Parse & validate arguments
   - Execute tool function
   - Format output
   - Add result to history
   - Loop back to LLM
4. **If direct response**: Display to user

### 5. Available Tools (30+ tools)
- **File Operations**: read_file, write_file, edit_file, patch_file, list_files
- **Testing**: run_tests, analyze_test_failures, get_coverage, generate_tests
- **Code Analysis**: detect_changed_files, analyze_coverage_gaps
- **Planning**: todo_write, plan_write, extract_tasks_from_prd
- **Diagrams**: generate_mermaid_diagram
- **And more**: run_command, scaffold, LSP, sub-agents

## Key Decision Points

| Decision | Condition | Next Step |
|----------|-----------|-----------|
| Plan mode? | `/plan` command detected | Enter plan workflow |
| Has todos? | Uncompleted tasks exist | Update and execute |
| LLM response type | Tool calls or direct text | Execute tools or display |
| Args valid? | JSON parsing succeeds | Execute or return error |
| More todos? | Tasks remaining | Mark next in-progress |
| Task complete? | All todos done | Wait for next input |

## Architecture Components

```
┌─────────────────────────────────────────────────────────┐
│                    AIAgentCore                          │
│  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │ TodoStateManager│  │      PlanStateManager       │  │
│  └────────┬────────┘  └─────────────┬───────────────┘  │
│           │                        │                  │
│  ┌────────▼────────┐  ┌─────────────▼───────────────┐  │
│  │MessageHistoryMgr│  │       ToolExecutor          │  │
│  └────────┬────────┘  │  ┌───────────────────────┐  │  │
│           │           │  │ CompletionService     │  │  │
│  ┌────────▼────────┐  │  └───────────────────────┘  │  │
│  │  Tool Output    │  └─────────────────────────────┘  │
│  │   Formatter     │                                    │
│  └─────────────────┘                                   │
└─────────────────────────────────────────────────────────┘
```

## Color Legend

- 🔷 **Blue**: Process nodes (actions taken)
- 🔶 **Orange**: Data nodes (state storage)
- 🟢 **Green**: Start/End nodes
- 🩷 **Pink**: Decision nodes (branching logic)
