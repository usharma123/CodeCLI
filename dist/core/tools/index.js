import { fileTools } from "./files.js";
import { scaffoldTools } from "./scaffold.js";
import { commandTools } from "./commands.js";
import { testTools } from "./tests.js";
import { generationTools } from "./generation.js";
import { advancedTestingTools } from "./advanced-testing.js";
import { prdTestingTools } from "./prd-testing.js";
import { todoTools } from "./todos.js";
import { delegationTools } from "./delegation.js";
import { setAgentInstance } from "./shared.js";
export const toolDefinitions = [
    ...fileTools,
    ...scaffoldTools,
    ...commandTools,
    ...testTools,
    ...generationTools,
    ...advancedTestingTools,
    ...prdTestingTools,
    ...todoTools,
    ...delegationTools, // Add delegation tool
];
export { setAgentInstance };
