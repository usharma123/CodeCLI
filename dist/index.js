import dotenv from "dotenv";
import React from "react";
import { render } from "ink";
import { App } from "./ui/app.js";
import { AIAgent } from "./core/agent.js";
import { toolDefinitions, setAgentInstance } from "./core/tools/index.js";
import { enableInkConfirmations, setReadlineConfirm } from "./core/confirm.js";
import { colors } from "./utils/colors.js";
dotenv.config();
async function main() {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        console.error(`${colors.red}Error: OPENROUTER_API_KEY environment variable is not set${colors.reset}`);
        console.error("Get your API key from: https://openrouter.ai/keys");
        console.error("\nSet it in your .env file:");
        console.error("OPENROUTER_API_KEY=sk-or-v1-your-api-key-here");
        process.exit(1);
    }
    const agent = new AIAgent(apiKey, toolDefinitions);
    setAgentInstance(agent);
    setReadlineConfirm(async (message) => {
        const answer = await agent.rl.question(`${message} (y/n): `);
        return answer.toLowerCase() === "y" || answer.toLowerCase() === "yes";
    });
    if (process.stdin.isTTY) {
        enableInkConfirmations();
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
        }));
        await inkApp.waitUntilExit();
        agent.close();
    }
    else {
        console.error(`${colors.yellow}Warning: Non-interactive mode. Please run in a terminal.${colors.reset}`);
        try {
            await agent.run();
        }
        catch (error) {
            console.error(`${colors.red}Fatal error: ${error}${colors.reset}`);
            agent.close();
            process.exit(1);
        }
    }
}
main().catch((error) => {
    console.error(error);
    process.exit(1);
});
export { AIAgent };
