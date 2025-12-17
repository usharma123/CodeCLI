import {
  ToolDefinition,
  ExploreCodebaseInput,
  AnalyzeCodeImplementationInput,
  BulkFileOperationsInput,
} from "../types.js";
import { getAgentManager } from "../agent-system/agent-manager.js";
import { createAgentTask } from "../agent-system/agent-protocol.js";

/**
 * Sub-Agent Tool Wrappers (Hybrid Architecture)
 *
 * These tools wrap sub-agent invocations as regular tools, allowing the main
 * sequential agent to transparently delegate context-heavy operations without
 * explicit delegation management.
 *
 * Key principles:
 * - Accept structured parameters (not generic task descriptions)
 * - Internally delegate to appropriate sub-agents
 * - Return plain strings (not JSON-wrapped results)
 * - Include ⚡ in descriptions to indicate heavy operations
 */

/**
 * Tool 1: Explore Codebase
 * Delegates large-scale file exploration to FileSystemAgent
 */
const exploreCodebaseTool: ToolDefinition = {
  name: "explore_codebase",
  description: `⚡ Heavy operation: Explore codebase patterns and directory structures efficiently.

Use this tool when you need to:
- Search across many files (>5 files)
- Understand directory structures and organization
- Find files matching complex patterns
- Explore unfamiliar parts of the codebase

DO NOT use this for:
- Reading a single specific file (use read_file)
- Simple file listings (use list_files)
- Quick searches in known locations (use grep/glob)

This tool consumes significant context and should only be used when the scope genuinely requires exploration.`,
  parameters: {
    type: "object",
    properties: {
      pattern: {
        type: "string",
        description:
          "Glob pattern, search term, or description of what to find (e.g., '*.ts', 'authentication logic', 'test files')",
      },
      focus: {
        type: "string",
        description:
          "What aspect to focus on (e.g., 'find all React components', 'understand authentication flow', 'locate configuration files')",
      },
      depth: {
        type: "string",
        enum: ["quick", "thorough"],
        description:
          "Exploration depth: 'quick' for fast overview, 'thorough' for comprehensive analysis",
      },
    },
    required: ["pattern", "focus"],
  },
  function: async (input: ExploreCodebaseInput): Promise<string> => {
    try {
      const agentManager = getAgentManager();
      const fsAgent = agentManager.getAgent("filesystem");

      if (!fsAgent) {
        return "Error: FileSystemAgent not available. Sub-agents may not be enabled.";
      }

      // Create structured task for FileSystemAgent
      const task = createAgentTask(
        "filesystem",
        `Explore codebase: pattern="${input.pattern}". Focus: ${input.focus}. Depth: ${input.depth || "quick"}.`,
        {
          pattern: input.pattern,
          focus: input.focus,
          depth: input.depth || "quick",
          operation: "explore",
        }
      );

      // Execute task directly on FileSystemAgent
      const result = await fsAgent.executeTask(task);

      // Return plain result (not JSON-wrapped)
      if (result.status === "success") {
        const response =
          typeof result.data === "string"
            ? result.data
            : result.data?.response || JSON.stringify(result.data);
        return `Exploration Results:\n\n${response}`;
      } else {
        return `Error during codebase exploration: ${result.error}\n\nSuggestion: Try narrowing your pattern or using direct file tools for specific files.`;
      }
    } catch (error) {
      return `Failed to explore codebase: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
};

/**
 * Tool 2: Analyze Code Implementation
 * Delegates deep code analysis to AnalysisAgent
 */
const analyzeCodeImplementationTool: ToolDefinition = {
  name: "analyze_code_implementation",
  description: `⚡ Heavy operation: Deep analysis of code architecture, requirements, or implementation patterns.

Use this tool when you need to:
- Understand complex code architectures across multiple files
- Parse and analyze Product Requirement Documents (PRDs)
- Review code structure and design patterns
- Identify high-level relationships and dependencies

DO NOT use this for:
- Reading a single file's code (use read_file)
- Simple code reviews (read the files directly)
- Quick syntax checks

This tool consumes significant context and is designed for architectural understanding, not line-by-line code reading.`,
  parameters: {
    type: "object",
    properties: {
      files: {
        type: "array",
        items: { type: "string" },
        description:
          "List of file paths to analyze (can include glob patterns)",
      },
      focus: {
        type: "string",
        description:
          "What to focus on in the analysis (e.g., 'authentication architecture', 'data flow', 'API design patterns')",
      },
      analysis_type: {
        type: "string",
        enum: ["architecture", "requirements", "review"],
        description:
          "Type of analysis: 'architecture' for system design, 'requirements' for PRD parsing, 'review' for code quality",
      },
    },
    required: ["files", "focus", "analysis_type"],
  },
  function: async (input: AnalyzeCodeImplementationInput): Promise<string> => {
    try {
      const agentManager = getAgentManager();
      const analysisAgent = agentManager.getAgent("analysis");

      if (!analysisAgent) {
        return "Error: AnalysisAgent not available. Sub-agents may not be enabled.";
      }

      // Create structured task for AnalysisAgent
      const task = createAgentTask(
        "analysis",
        `Analyze ${input.analysis_type}: ${input.files.length} file(s). Focus: ${input.focus}.`,
        {
          files: input.files,
          focus: input.focus,
          analysisType: input.analysis_type,
          operation: "analyze",
        }
      );

      // Execute task directly on AnalysisAgent
      const result = await analysisAgent.executeTask(task);

      // Return plain result (not JSON-wrapped)
      if (result.status === "success") {
        const response =
          typeof result.data === "string"
            ? result.data
            : result.data?.response || JSON.stringify(result.data);
        return `Analysis Results (${input.analysis_type}):\n\n${response}`;
      } else {
        return `Error during code analysis: ${result.error}\n\nSuggestion: Try analyzing fewer files or using read_file for direct file access.`;
      }
    } catch (error) {
      return `Failed to analyze code: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
};

/**
 * Tool 3: Bulk File Operations
 * Delegates multi-file operations to FileSystemAgent
 */
const bulkFileOperationsTool: ToolDefinition = {
  name: "bulk_file_operations",
  description: `⚡ Heavy operation: Perform operations across many files efficiently.

Use this tool when you need to:
- Read 5+ files at once
- Search across multiple specific files
- Batch process file operations

DO NOT use this for:
- Single file reads (use read_file)
- Directory listings (use list_files)
- Small sets of files (<5 files) - just use read_file multiple times

This tool is optimized for parallel processing of many files and should only be used when the operation genuinely requires bulk handling.`,
  parameters: {
    type: "object",
    properties: {
      operation: {
        type: "string",
        enum: ["read", "search"],
        description: "'read' to read file contents, 'search' to search within files",
      },
      files: {
        type: "array",
        items: { type: "string" },
        description: "List of file paths to operate on",
      },
      pattern: {
        type: "string",
        description: "Search pattern (only required for 'search' operation)",
      },
    },
    required: ["operation", "files"],
  },
  function: async (input: BulkFileOperationsInput): Promise<string> => {
    try {
      // Validate minimum file count
      if (input.files.length < 5) {
        return `Suggestion: For ${input.files.length} file(s), consider using read_file or grep directly instead of bulk operations. This tool is optimized for 5+ files.`;
      }

      const agentManager = getAgentManager();
      const fsAgent = agentManager.getAgent("filesystem");

      if (!fsAgent) {
        return "Error: FileSystemAgent not available. Sub-agents may not be enabled.";
      }

      // Create structured task for FileSystemAgent
      const task = createAgentTask(
        "filesystem",
        `Bulk ${input.operation}: ${input.files.length} file(s).${input.pattern ? ` Pattern: ${input.pattern}` : ""}`,
        {
          operation: `bulk_${input.operation}`,
          files: input.files,
          pattern: input.pattern,
        }
      );

      // Execute task directly on FileSystemAgent
      const result = await fsAgent.executeTask(task);

      // Return plain result (not JSON-wrapped)
      if (result.status === "success") {
        const response =
          typeof result.data === "string"
            ? result.data
            : result.data?.response || JSON.stringify(result.data);
        return `Bulk Operation Results (${input.operation} on ${input.files.length} files):\n\n${response}`;
      } else {
        return `Error during bulk file operations: ${result.error}\n\nSuggestion: Try operating on fewer files or use direct tools for specific files.`;
      }
    } catch (error) {
      return `Failed to perform bulk operations: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
};

/**
 * Export all sub-agent tools
 */
export const subAgentTools: ToolDefinition[] = [
  exploreCodebaseTool,
  analyzeCodeImplementationTool,
  bulkFileOperationsTool,
];
