# Coding Agent Decision Workflow

```mermaid
flowchart TD
    START([User Input]) --> INPUT_PARSE
    
    subgraph "Main Agent Loop"
        INPUT_PARSE{Parse Input} -->|Slash Command| SLASH_CMD
        INPUT_PARSE{Parse Input} -->|File Reference| FILE_REF
        INPUT_PARSE{Parse Input} -->|Shell Command| SHELL_CMD
        INPUT_PARSE{Parse Input} -->|Regular Request| ROUTING
        
        SLASH_CMD[/Execute Slash Command/] --> ROUTING
        FILE_REF[/Load File Context/] --> ROUTING
        SHELL_CMD[/Queue Shell Command/] --> ROUTING
        
        ROUTING{Route Request} --> TODO_CHECK
        ROUTING --> FILE_OPS
        ROUTING --> CODE_GEN
        ROUTING --> TESTING
        ROUTING --> ANALYSIS
        ROUTING --> PRDS
        ROUTING --> DIAGRAM
        
        TODO_CHECK{3+ Steps?} -->|Yes| CREATE_TODO[Create Todo List]
        TODO_CHECK -->|No| TOOL_SELECTION
        
        CREATE_TODO --> TOOL_SELECTION
        
        TOOL_SELECTION{Select Tool} --> FILE_TOOLS
        TOOL_SELECTION --> GEN_TOOLS
        TOOL_SELECTION --> TEST_TOOLS
        TOOL_SELECTION --> CMD_TOOLS
        TOOL_SELECTION --> DIAGRAM_TOOLS
        TOOL_SELECTION --> SUBA_AGENT_TOOLS
        TOOL_SELECTION --> TODO_TOOLS
        TOOL_SELECTION --> PRD_TOOLS
    end
    
    subgraph "Tool Categories"
        FILE_TOOLS[File Tools<br/>read_file, write_file<br/>edit_file, list_files] --> EXEC_TOOL
        GEN_TOOLS[Generation Tools<br/>scaffold, generation] --> EXEC_TOOL
        TEST_TOOLS[Testing Tools<br/>run_tests, generate_tests<br/>analyze_coverage] --> EXEC_TOOL
        CMD_TOOLS[Command Tools<br/>run_command] --> EXEC_TOOL
        DIAGRAM_TOOLS[Diagram Tools<br/>generate_mermaid] --> EXEC_TOOL
        TODO_TOOLS[Todo Tools<br/>todo_write] --> EXEC_TOOL
        PRD_TOOLS[PRD Tools<br/>parse_prd, extract_tasks<br/>process_prd] --> EXEC_TOOL
        SUBA_AGENT_TOOLS[⚡ Sub-Agent Tools<br/>explore_codebase<br/>analyze_code_implementation] --> SUBA_AGENT
    end
    
    subgraph "Sub-Agent Hybrid Architecture"
        SUBA_AGENT{Route to Sub-Agent} -->|filesystem| FS_AGENT[FileSystemAgent]
        SUBA_AGENT{Route to Sub-Agent} -->|analysis| ANALYZE_AGENT[AnalysisAgent]
        
        FS_AGENT --> FS_EXEC[Execute parallel<br/>file operations]
        ANALYZE_AGENT --> ANALYZE_EXEC[Deep code analysis<br/>architecture review]
        
        FS_EXEC --> SUBA_RESULT
        ANALYZE_EXEC --> SUBA_RESULT
        
        SUBA_RESULT[Return plain result<br/>to main agent]
    end
    
    EXEC_TOOL[Execute Selected Tool] --> TOOL_OUTPUT[Get Tool Result]
    TOOL_OUTPUT --> OUTPUT_TRUNCATE{Truncate > 6000 chars?}
    OUTPUT_TRUNCATE -->|Yes| TRUNCATE[Truncate output]
    OUTPUT_TRUNCATE -->|No| ADD_TO_HISTORY
    TRUNCATE --> ADD_TO_HISTORY
    
    ADD_TO_HISTORY[Add to message history<br/>max 40 messages] --> HISTORY_CHECK
    
    HISTORY_CHECK{> 40 messages?} -->|Yes| COMPACT[Context Compaction<br/>Summarize history] --> REASONING
    
    REASONING{AI Reasoning} -->|Tool Calls| TOOL_SELECTION
    REASONING -->|Final Answer| FORMAT_OUTPUT
    REASONING -->|More Steps| UPDATE_TODO[Update Todo Status]
    
    UPDATE_TODO -->|in_progress| NEXT_TODO[Mark Next Todo<br/>as in_progress]
    UPDATE_TODO -->|completed| CHECK_ALL[All todos done?]
    
    CHECK_ALL -->|No| NEXT_TODO
    CHECK_ALL -->|Yes| TASK_COMPLETE[Task Complete]
    
    FORMAT_OUTPUT[Format output<br/>render markdown] --> USER_RESPONSE([Return to User])
    
    TASK_COMPLETE --> USER_RESPONSE
    
    %% Styling
    classDef decision fill:#f9f,stroke:#333,stroke-width:2px
    classDef tool fill:#9cf,stroke:#333,stroke-width:1px
    classDef subprocess fill:#ff9,stroke:#333,stroke-width:1px
    classDef startend fill:#9f9,stroke:#333,stroke-width:2px
    classDef heavy fill:#f96,stroke:#333,stroke-width:2px
    
    class INPUT_PARSE,ROUTING,TOOL_SELECTION,TODO_CHECK,OUTPUT_TRUNCATE,HISTORY_CHECK,REASONING,CHECK_ALL,SUBA_AGENT decision
    class FILE_TOOLS,GEN_TOOLS,TEST_TOOLS,CMD_TOOLS,DIAGRAM_TOOLS,TODO_TOOLS,PRD_TOOLS,SUBA_AGENT_TOOLS tool
    class FILE_OPS,CODE_GEN,TESTING,ANALYSIS,PRDS,DIAGRAM,EXEC_TOOL,TOOL_OUTPUT subprocess
    class SUBA_AGENT,FS_AGENT,ANALYZE_AGENT,FS_EXEC,ANALYZE_EXEC,SUBA_RESULT heavy
    class START,USER_RESPONSE,TASK_COMPLETE startend
```

## Workflow Summary

### 1. Input Parsing & Routing
- **Slash Commands** (`/test`, `/diagram`, etc.)
- **File References** (`@file.ts`)
- **Shell Commands** (`!npm install`)
- **Regular Requests** → routed to appropriate handler

### 2. Todo-Driven Multi-Step Tasks
- For tasks with 3+ steps, automatically creates todo list
- Only ONE todo can be "in_progress" at a time
- Updates status as tasks complete

### 3. Tool Categories (8 categories, 20+ tools)
| Category | Tools |
|----------|-------|
| **File Tools** | read_file, write_file, edit_file, patch_file, list_files |
| **Generation** | scaffold, generate_mermaid, generate_tests, generate_regression_test |
| **Testing** | run_tests, analyze_test_failures, get_coverage, analyze_coverage_gaps |
| **Commands** | run_command |
| **PRD** | parse_prd, extract_tasks_from_prd, process_prd_with_tasks |
| **Todo** | todo_write |
| **Sub-Agents** | explore_codebase, analyze_code_implementation, bulk_file_operations |

### 4. Hybrid Sub-Agent Architecture
- **FileSystemAgent**: Parallel file exploration, multi-file operations
- **AnalysisAgent**: Deep architectural analysis, PRD parsing
- Lightweight wrapper around LLM calls (claude-sonnet-4.5)

### 5. Context Management
- Max 40 messages in history (~20 exchanges)
- Automatic context compaction when limit reached
- Output truncation at 6000 characters

### 6. Decision Points
1. **Input Type Detection** → Route to appropriate handler
2. **Todo Check** → Create todo list for complex tasks
3. **Tool Selection** → Choose from 8 tool categories
4. **Output Truncation** → Prevent token overflow
5. **History Check** → Trigger context compaction
6. **AI Reasoning** → Tool call loop or final response
7. **Todo Completion** → Mark next task or complete

### 7. API Integration
- Uses OpenRouter API with fallback models (minimax, claude-sonnet-4.5)
- 2-minute timeout on API calls
- Streaming disabled by default (conflicts with Ink UI)
