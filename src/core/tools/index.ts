import { ToolDefinition } from "../types.js";
import { fileTools } from "./files.js";
import { scaffoldTools } from "./scaffold.js";
import { commandTools } from "./commands.js";
import { testTools } from "./tests.js";
import { generationTools } from "./generation.js";
import { advancedTestingTools } from "./advanced-testing.js";
import { prdTestingTools } from "./prd-testing.js";
import { todoTools } from "./todos.js";
import { subAgentTools } from "./sub-agent-tools.js";
import { diagramTools } from "./diagram.js";
import { setAgentInstance } from "./shared.js";
import { isSubAgentsEnabled } from "../feature-flags.js";

export const toolDefinitions: ToolDefinition[] = [
  ...fileTools,
  ...scaffoldTools,
  ...commandTools,
  ...testTools,
  ...generationTools,
  ...advancedTestingTools,
  ...prdTestingTools,
  ...todoTools,
  ...diagramTools,
  // Sub-agent tools (hybrid architecture) for exploration
  ...(isSubAgentsEnabled() ? subAgentTools : []),
];

export { setAgentInstance };
