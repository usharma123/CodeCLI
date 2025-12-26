import { ToolDefinition } from "../types.js";
import { fileTools } from "./files.js";
import { scaffoldTools } from "./scaffold.js";
import { commandTools } from "./commands.js";
import { testTools } from "./tests.js";
import { generationTools } from "./generation.js";
import { advancedTestingTools } from "./advanced-testing.js";
import { prdTestingTools } from "./prd-testing.js";
import { prdTaskExtractionTools } from "./prd-task-extraction.js";
import { prdWorkflowTools } from "./prd-workflow.js";
import { todoTools } from "./todos.js";
import { planTools } from "./plan.js";
import { subAgentTools } from "./sub-agent-tools.js";
import { diagramTools } from "./diagram.js";
import { lspTools } from "./lsp.js";
import { setAgentInstance } from "./shared.js";
import { isSubAgentsEnabled, isLSPEnabled } from "../feature-flags.js";

export const toolDefinitions: ToolDefinition[] = [
  ...fileTools,
  ...scaffoldTools,
  ...commandTools,
  ...testTools,
  ...generationTools,
  ...advancedTestingTools,
  ...prdTestingTools,
  ...prdTaskExtractionTools,
  ...prdWorkflowTools,
  ...todoTools,
  ...planTools,
  ...diagramTools,
  // Sub-agent tools (hybrid architecture) for exploration
  ...(isSubAgentsEnabled() ? subAgentTools : []),
  // LSP tools for real-time diagnostics
  ...(isLSPEnabled() ? lspTools : []),
];

export { setAgentInstance };
