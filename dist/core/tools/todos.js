import { getAgentInstance } from "./shared.js";
export const todoTools = [
    {
        name: "todo_write",
        description: `Manage a todo list for the current task. Use this to:
- Create an initial todo list when starting a complex task (3+ steps)
- Update todo status as you complete work
- Add new todos discovered during execution

Each todo must have:
- content: Imperative form ("Run tests")
- activeForm: Present continuous ("Running tests")
- status: "pending", "in_progress", or "completed"

IMPORTANT: Only ONE todo should be in_progress at a time.
Complete current tasks before starting new ones.`,
        parameters: {
            type: "object",
            properties: {
                todos: {
                    type: "array",
                    description: "Complete updated todo list",
                    items: {
                        type: "object",
                        properties: {
                            content: {
                                type: "string",
                                minLength: 1
                            },
                            activeForm: {
                                type: "string",
                                minLength: 1
                            },
                            status: {
                                type: "string",
                                enum: ["pending", "in_progress", "completed"]
                            }
                        },
                        required: ["content", "activeForm", "status"]
                    }
                }
            },
            required: ["todos"],
            additionalProperties: false,
        },
        function: async (input) => {
            const agent = getAgentInstance();
            if (!agent)
                return "Error: Agent not initialized";
            // Validate input
            if (!Array.isArray(input.todos)) {
                return "Error: todos must be an array";
            }
            // Check that only one todo is in_progress
            const inProgressCount = input.todos.filter(t => t.status === "in_progress").length;
            if (inProgressCount > 1) {
                return "Warning: Only one todo should be in_progress at a time. Please mark completed todos as 'completed' before starting new ones.";
            }
            // Update agent's todo state
            agent.updateTodos(input.todos);
            // Return formatted summary
            return `Todo list updated. Current state:
${input.todos.map(t => {
                const icon = t.status === "completed" ? "✓" :
                    t.status === "in_progress" ? "→" : "○";
                return `${icon} ${t.content}`;
            }).join("\n")}`;
        }
    }
];
