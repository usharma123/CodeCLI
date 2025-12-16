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
