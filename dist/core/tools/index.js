import { fileTools } from "./files.js";
import { scaffoldTools } from "./scaffold.js";
import { commandTools } from "./commands.js";
import { testTools } from "./tests.js";
import { generationTools } from "./generation.js";
import { advancedTestingTools } from "./advanced-testing.js";
import { prdTestingTools } from "./prd-testing.js";
import { setAgentInstance } from "./shared.js";
export const toolDefinitions = [
    ...fileTools,
    ...scaffoldTools,
    ...commandTools,
    ...testTools,
    ...generationTools,
    ...advancedTestingTools,
    ...prdTestingTools,
];
export { setAgentInstance };
