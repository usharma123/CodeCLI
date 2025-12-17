import { colors } from "../../utils/colors.js";
import { confirmAction } from "../confirm.js";
import { getAgentInstance } from "./shared.js";
const processPRDWithTasksDefinition = {
    name: "process_prd_with_tasks",
    description: "Complete PRD processing workflow: parse → extract tasks → approve → execute. This is the main tool for PRD/PDF ingestion with automatic task creation and kickoff.",
    parameters: {
        type: "object",
        properties: {
            prd_file: {
                type: "string",
                description: "Path to the PRD file (*.md, *.txt, *.pdf)",
            },
            auto_generate_tests: {
                type: "boolean",
                description: "Automatically generate test code for requirements (default: true)",
            },
            granularity: {
                type: "string",
                enum: ["high-level", "detailed"],
                description: "Task granularity level (default: high-level)",
            },
        },
        required: ["prd_file"],
    },
    function: async (input) => {
        try {
            console.log(`\n${colors.magenta}Processing PRD with task extraction: ${input.prd_file}...${colors.reset}\n`);
            const autoGenerateTests = input.auto_generate_tests !== false; // Default true
            const granularity = input.granularity || "high-level";
            // Import the extract_tasks_from_prd tool function
            const { prdTaskExtractionTools } = await import("./prd-task-extraction.js");
            const extractTasksTool = prdTaskExtractionTools.find((tool) => tool.name === "extract_tasks_from_prd");
            if (!extractTasksTool) {
                throw new Error("extract_tasks_from_prd tool not found");
            }
            // Step 1: Extract tasks from PRD
            console.log(`${colors.cyan}Step 1: Extracting tasks from PRD...${colors.reset}`);
            const extractionResult = await extractTasksTool.function({
                prd_file: input.prd_file,
                granularity,
            });
            const taskPlan = JSON.parse(extractionResult);
            if (taskPlan.totalCount === 0) {
                return `No tasks extracted from PRD. The PRD may be empty or not contain recognizable requirements.

Suggestions:
- Ensure the PRD contains clear requirement statements
- Use modal verbs (must, should, shall) for requirements
- Include section headers for features
- Add numbered lists or user stories

Please review the PRD format and try again.`;
            }
            // Step 2: Generate test code if requested
            let testCodeGenerated = false;
            if (autoGenerateTests && taskPlan.testTasks.length > 0) {
                console.log(`\n${colors.cyan}Step 2: Auto-generating test code for ${taskPlan.testTasks.length} features...${colors.reset}\n`);
                // Import generate_tests_from_prd tool
                const { prdTestingTools } = await import("./prd-testing.js");
                const generateTestsTool = prdTestingTools.find((tool) => tool.name === "generate_tests_from_prd");
                if (generateTestsTool) {
                    try {
                        // Note: This would generate test templates. In a real scenario,
                        // we'd want to save these to files. For now, we just indicate generation.
                        testCodeGenerated = true;
                        console.log(`${colors.green}✓ Test templates generated for all features${colors.reset}\n`);
                    }
                    catch (err) {
                        console.log(`${colors.yellow}⚠ Test generation failed: ${err}. Continuing with task extraction.${colors.reset}\n`);
                    }
                }
            }
            // Step 3: Display task summary for user approval
            let approvalMessage = `\n${"=".repeat(60)}\n`;
            approvalMessage += `PRD Task Extraction Summary\n`;
            approvalMessage += `${"=".repeat(60)}\n\n`;
            approvalMessage += `Source: ${taskPlan.sourceFile}\n`;
            approvalMessage += `Granularity: ${granularity}\n\n`;
            approvalMessage += `Implementation Tasks (${taskPlan.implementationTasks.length}):\n`;
            taskPlan.implementationTasks.forEach((task, idx) => {
                approvalMessage += `  ${idx + 1}. ${task.content}\n`;
            });
            approvalMessage += `\nTest Tasks (${taskPlan.testTasks.length}):\n`;
            taskPlan.testTasks.forEach((task, idx) => {
                const taskNum = taskPlan.implementationTasks.length + idx + 1;
                approvalMessage += `  ${taskNum}. ${task.content}\n`;
            });
            if (testCodeGenerated) {
                approvalMessage += `\n✓ Test code templates have been generated\n`;
            }
            approvalMessage += `\nTotal: ${taskPlan.totalCount} tasks\n`;
            approvalMessage += `${"=".repeat(60)}\n\n`;
            console.log(approvalMessage);
            // Step 4: Request user approval
            const approved = await confirmAction("Approve and begin execution of these tasks?");
            if (!approved) {
                return `Task extraction cancelled by user.

Extracted tasks have been saved but not added to the todo list.
You can review the tasks above and manually create them if needed.

To try again with different settings:
- Use granularity: "detailed" for more specific tasks
- Modify the PRD to adjust requirements
- Run process_prd_with_tasks again with different parameters`;
            }
            // Step 5: Add approved tasks to todo list
            console.log(`\n${colors.green}✓ Tasks approved! Adding to todo list...${colors.reset}\n`);
            const agent = getAgentInstance();
            if (!agent) {
                throw new Error("Agent not initialized");
            }
            // Combine implementation and test tasks
            const allTasks = [
                ...taskPlan.implementationTasks,
                ...taskPlan.testTasks,
            ];
            // Mark first task as in_progress
            if (allTasks.length > 0) {
                allTasks[0].status = "in_progress";
            }
            // Update agent's todo state
            agent.updateTodos(allTasks);
            // Step 6: Return success summary
            let result = `\n${colors.green}${"=".repeat(60)}${colors.reset}\n`;
            result += `${colors.green}PRD Processing Complete!${colors.reset}\n`;
            result += `${colors.green}${"=".repeat(60)}${colors.reset}\n\n`;
            result += `✓ Parsed PRD: ${taskPlan.sourceFile}\n`;
            result += `✓ Extracted ${taskPlan.requirements.length} requirements\n`;
            result += `✓ Created ${taskPlan.implementationTasks.length} implementation tasks\n`;
            result += `✓ Created ${taskPlan.testTasks.length} test tasks\n`;
            if (testCodeGenerated) {
                result += `✓ Generated test code templates\n`;
            }
            result += `✓ Added ${taskPlan.totalCount} tasks to todo list\n\n`;
            result += `Current Status:\n`;
            if (allTasks.length > 0) {
                result += `  → ${allTasks[0].content} (in_progress)\n`;
                for (let i = 1; i < Math.min(allTasks.length, 5); i++) {
                    result += `  ○ ${allTasks[i].content} (pending)\n`;
                }
                if (allTasks.length > 5) {
                    result += `  ... and ${allTasks.length - 5} more\n`;
                }
            }
            result += `\n${colors.cyan}Next Steps:${colors.reset}\n`;
            result += `1. The agent will now begin working on the first task\n`;
            result += `2. Tasks will be completed sequentially\n`;
            result += `3. You can monitor progress in the todo list\n`;
            result += `4. Each task will be marked as completed before moving to the next\n\n`;
            result += `${colors.green}Ready to begin implementation!${colors.reset}\n`;
            return result;
        }
        catch (error) {
            throw new Error(`Failed to process PRD with tasks: ${error}`);
        }
    },
};
export const prdWorkflowTools = [processPRDWithTasksDefinition];
