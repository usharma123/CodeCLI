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
export interface GenerateTestsInput {
  file_path: string;
  language: "python" | "java";
  coverage_data?: string;
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
