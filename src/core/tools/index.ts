import { ToolDefinition } from "../types.js";
import { fileTools } from "./files.js";
import { scaffoldTools } from "./scaffold.js";
import { commandTools } from "./commands.js";
import { testTools } from "./tests.js";
import { generationTools } from "./generation.js";
import { setAgentInstance } from "./shared.js";

export const toolDefinitions: ToolDefinition[] = [
  ...fileTools,
  ...scaffoldTools,
  ...commandTools,
  ...testTools,
  ...generationTools,
];

export { setAgentInstance };
