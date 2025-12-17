export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  function: (input: any) => Promise<string>;
}

export interface ReadFileInput {
  path: string;
}
export interface ListFilesInput {
  path?: string;
}
export interface EditFileInput {
  path: string;
  old_str: string;
  new_str: string;
}
export interface WriteFileInput {
  path: string;
  content: string;
}
export interface ScaffoldProjectInput {
  template: "api" | "chatbot" | "static" | "react";
  name?: string;
  target_dir?: string;
  model?: string;
  include_api?: boolean;
}
export interface PatchFileInput {
  path: string;
  patch: string;
}
export interface RunCommandInput {
  command: string;
  working_dir?: string;
  timeout_seconds?: number;
}
export interface RunTestsInput {
  language?: "python" | "java" | "all";
  mode?: "smoke" | "sanity" | "full";
  coverage?: boolean;
}
export interface AnalyzeTestFailuresInput {
  test_output: string;
  language: "python" | "java";
}
export interface GetCoverageInput {
  language: "python" | "java";
}
export interface DetectChangedFilesInput {
  since?: string;
  language?: "python" | "java" | "all";
}
export type SpringBootComponentType =
  | "controller"
  | "service"
  | "repository"
  | "configuration"
  | "component";

export type BuildTool = "maven" | "gradle" | "unknown";
export type Language = "java" | "kotlin" | "unknown";

export interface BuildConfig {
  tool: BuildTool;
  mainSourceDir: string; // e.g., "src/main/java"
  testSourceDir: string; // e.g., "src/test/java"
  buildFile: string | null; // e.g., "pom.xml" or "build.gradle"
}

export interface GenerateTestsInput {
  file_path: string;
  language: "python" | "java";
  coverage_data?: string;
  spring_boot_component?: SpringBootComponentType;
}
export interface AnalyzeCoverageGapsInput {
  language: "python" | "java" | "all";
  min_coverage?: number;
}
export interface GenerateRegressionTestInput {
  bug_description: string;
  fixed_file: string;
  language: "python" | "java";
}
export interface GenerateIntegrationTestInput {
  components: string[];
  language: "python" | "java" | "javascript";
  test_scenario: string;
}
export interface GenerateE2ETestInput {
  user_journey: string;
  app_type: "web" | "api" | "cli";
  framework?: "playwright" | "selenium" | "cypress" | "puppeteer";
}
export interface GenerateAPITestInput {
  api_spec?: string;
  endpoints: string[];
  language: "javascript" | "python" | "java";
}
export interface ParsePRDInput {
  prd_file: string;
  output_format?: "markdown" | "json";
}
export interface GenerateTestsFromPRDInput {
  test_cases_file: string;
  language: "python" | "java" | "javascript";
  test_suite: "unit" | "integration" | "system" | "uat";
}
export interface GeneratePerformanceTestInput {
  target_url: string;
  test_type: "load" | "stress" | "spike" | "endurance";
  tool?: "k6" | "jmeter" | "locust" | "artillery";
}

// Todo list interfaces
export interface TodoItem {
  id?: string;
  content: string;
  activeForm: string;
  status: "pending" | "in_progress" | "completed";
  createdAt?: number;
}

export interface TodoState {
  todos: TodoItem[];
  lastUpdated: number;
}

export interface TodoWriteInput {
  todos: TodoItem[];
}

export interface ReasoningCheckpoint {
  phase: "analysis" | "execution" | "completion";
  reasoning: string;
  timestamp: number;
}

// Multi-Agent System Types

/**
 * Agent types in the multi-agent system
 */
export type AgentType =
  | "orchestrator"  // Primary coordinator
  | "filesystem"    // File operations specialist
  | "testing"       // Test execution and generation
  | "build"         // Command execution and builds
  | "analysis";     // Code analysis and planning

/**
 * Agent capabilities and configuration
 */
export interface AgentCapabilities {
  name: string;
  type: AgentType;
  tools: ToolDefinition[];
  systemPrompt: string;
  canDelegate: boolean;
  maxConcurrentTasks?: number;
}

/**
 * Shared context for agent execution
 */
export interface AgentContext {
  conversationHistory: any[];
  workingDirectory: string;
  parentAgent?: string;  // Agent ID
  sharedMemory: Map<string, any>;
}

/**
 * Task to be executed by an agent
 */
export interface AgentTask {
  id: string;
  type: AgentType | string;
  description: string;
  context: Record<string, any>;
  priority: "low" | "normal" | "high";
  timeout?: number;
  dependencies?: string[];  // Other task IDs that must complete first
}

/**
 * Result from agent task execution
 */
export interface AgentResult {
  taskId: string;
  status: "success" | "error" | "partial";
  data: any;
  error?: string;
  metrics: {
    duration: number;
    toolCallCount: number;
    tokensUsed: number;
  };
}

/**
 * Request to delegate work to another agent
 */
export interface DelegationRequest {
  taskId: string;
  targetAgent: AgentType;
  task: AgentTask;
  callback?: (result: AgentResult) => void;
  depth?: number; // Current depth in delegation chain
}

/**
 * Delegation tool input
 */
export interface DelegateToAgentInput {
  agent_type: AgentType;
  task_description: string;
  context?: Record<string, any>;
  priority?: "low" | "normal" | "high";
}
