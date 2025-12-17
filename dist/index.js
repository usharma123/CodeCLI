import dotenv from "dotenv";
import React from "react";
import { render } from "ink";
import { App } from "./ui/app.js";
import { AIAgent } from "./core/agent.js";
import { toolDefinitions, setAgentInstance } from "./core/tools/index.js";
import { setReadlineConfirm } from "./core/confirm.js";
import { colors } from "./utils/colors.js";
import { isSubAgentsEnabled } from "./core/feature-flags.js";
import { getAgentManager } from "./core/agent-system/agent-manager.js";
import { getSharedContext } from "./core/agent-system/agent-context.js";
import { FileSystemAgent } from "./core/agents/filesystem.js";
import { AnalysisAgent } from "./core/agents/analysis.js";
dotenv.config();
async function main() {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const argv = process.argv.slice(2);
    const verboseTools = argv.includes("--verbose-tools") ||
        process.env.TOOLS_VERBOSE === "1";
    if (!apiKey) {
        console.error(`${colors.red}Error: OPENROUTER_API_KEY environment variable is not set${colors.reset}`);
        console.error("Get your API key from: https://openrouter.ai/keys");
        console.error("\nSet it in your .env file:");
        console.error("OPENROUTER_API_KEY=sk-or-v1-your-api-key-here");
        process.exit(1);
    }
    const agent = new AIAgent(apiKey, toolDefinitions, true, {
        verboseTools,
        // Disable streaming by default for Ink stability.
        streamAssistantResponses: false,
        streamCommandOutput: false,
    });
    setAgentInstance(agent);
    // Initialize exploration agents if enabled
    if (isSubAgentsEnabled()) {
        console.log(`${colors.cyan}🤖 Exploration agents enabled${colors.reset}`);
        const agentManager = getAgentManager();
        const sharedContext = getSharedContext(process.cwd());
        // Register exploration agents
        const fsAgent = new FileSystemAgent(apiKey, sharedContext.createAgentContext());
        agentManager.registerAgent(fsAgent);
        const analysisAgent = new AnalysisAgent(apiKey, sharedContext.createAgentContext());
        agentManager.registerAgent(analysisAgent);
        console.log(`${colors.green}✓ Registered 2 exploration agents:${colors.reset}`);
        console.log(`${colors.gray}  📁 FileSystemAgent (codebase exploration)${colors.reset}`);
        console.log(`${colors.gray}  🔍 AnalysisAgent (code analysis)${colors.reset}`);
        console.log(`${colors.gray}Exploration tools: explore_codebase, analyze_code_implementation, bulk_file_operations${colors.reset}\n`);
    }
    else {
        console.log(`${colors.gray}Exploration agents disabled (set ENABLE_SUB_AGENTS=true to enable)${colors.reset}\n`);
    }
    setReadlineConfirm(async (message) => {
        if (!agent.rl) {
            // If readline is not available, auto-approve (should not happen in normal usage)
            console.log(`${colors.yellow}Warning: Readline not available, auto-approving operation${colors.reset}`);
            return true;
        }
        const answer = await agent.rl.question(`${message} (y/n): `);
        return answer.toLowerCase() === "y" || answer.toLowerCase() === "yes";
    });
    if (process.stdin.isTTY) {
        // Create agent ref to pass to UI
        const agentRef = React.createRef();
        // Use Ink-based confirmations integrated with the main app
        const inkApp = render(React.createElement(App, {
            onSubmit: async (userInput) => {
                if (!userInput.trim())
                    return;
                console.log(`\n${colors.gray}> ${userInput}${colors.reset}\n`);
                try {
                    await agent.processUserInput(userInput);
                }
                catch (error) {
                    console.error(`${colors.red}Error: ${error}${colors.reset}`);
                }
                console.log("");
            },
            onConfirmRequest: (handler) => {
                // Set handler HERE, inside callback when Ink UI is ready
                setReadlineConfirm(async (message) => {
                    return await handler(message);
                });
            },
            agentRef: agentRef,
        }));
        // Set the ref after creating agent
        agentRef.current = agent;
        await inkApp.waitUntilExit();
        agent.close();
    }
    else {
        console.error(`${colors.red}Error: Non-interactive mode is not supported.${colors.reset}`);
        console.error(`${colors.yellow}This agent requires a TTY (terminal) to function.${colors.reset}`);
        console.error("\nPlease run this agent in an interactive terminal environment.");
        console.error("Examples:");
        console.error("  - Run directly: bun start");
        console.error("  - Not supported: echo 'command' | bun start");
        console.error("  - Not supported: CI/CD pipelines without TTY");
        process.exit(1);
    }
}
main().catch((error) => {
    console.error(error);
    process.exit(1);
});
export { AIAgent };
