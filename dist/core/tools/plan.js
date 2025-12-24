import { getAgentInstance } from "./shared.js";
export const planTools = [
    {
        name: "plan_write",
        description: `Create and display an implementation plan for user approval. Use this tool when:
- User requests /plan command
- You need user approval before starting complex implementation
- You want to propose an implementation strategy

The plan will be displayed to the user with options to:
- Approve and proceed (converts plan sections to todos)
- Reject and cancel
- Modify with custom instructions

Each section should represent a distinct phase of work with specific tasks and affected files.`,
        parameters: {
            type: "object",
            properties: {
                title: {
                    type: "string",
                    description: "Short title for the plan (e.g., 'Add dark mode feature')"
                },
                summary: {
                    type: "string",
                    description: "1-3 sentence summary of what will be implemented"
                },
                sections: {
                    type: "array",
                    description: "Implementation phases/sections",
                    items: {
                        type: "object",
                        properties: {
                            title: {
                                type: "string",
                                description: "Section title (e.g., 'Phase 1: Setup')"
                            },
                            description: {
                                type: "string",
                                description: "Brief description of this phase"
                            },
                            tasks: {
                                type: "array",
                                items: { type: "string" },
                                description: "List of specific tasks in this phase"
                            },
                            files: {
                                type: "array",
                                items: { type: "string" },
                                description: "Files that will be created or modified"
                            }
                        },
                        required: ["title", "description", "tasks"]
                    }
                },
                risks: {
                    type: "array",
                    items: { type: "string" },
                    description: "Optional: potential risks or considerations"
                },
                alternatives: {
                    type: "array",
                    items: { type: "string" },
                    description: "Optional: alternative approaches considered"
                }
            },
            required: ["title", "summary", "sections"],
            additionalProperties: false,
        },
        function: async (input) => {
            const agent = getAgentInstance();
            if (!agent)
                return "Error: Agent not initialized";
            // Validate input
            if (!input.title || typeof input.title !== "string") {
                return "Error: title must be a non-empty string";
            }
            if (!input.summary || typeof input.summary !== "string") {
                return "Error: summary must be a non-empty string";
            }
            if (!Array.isArray(input.sections) || input.sections.length === 0) {
                return "Error: sections must be a non-empty array";
            }
            // Validate each section
            for (let i = 0; i < input.sections.length; i++) {
                const section = input.sections[i];
                if (!section.title || !section.description || !Array.isArray(section.tasks)) {
                    return `Error: section ${i + 1} must have title, description, and tasks array`;
                }
                if (section.tasks.length === 0) {
                    return `Error: section ${i + 1} must have at least one task`;
                }
            }
            // Create the plan object
            const plan = {
                title: input.title,
                summary: input.summary,
                sections: input.sections,
                risks: input.risks,
                alternatives: input.alternatives
            };
            // Update agent's plan state
            agent.updatePlan(plan);
            // Count total tasks
            const totalTasks = input.sections.reduce((sum, s) => sum + s.tasks.length, 0);
            const totalFiles = input.sections.reduce((sum, s) => sum + (s.files?.length || 0), 0);
            // Return summary for agent context
            return `Plan "${input.title}" created with ${input.sections.length} sections, ${totalTasks} tasks${totalFiles > 0 ? `, affecting ${totalFiles} files` : ''}.

The plan is now displayed to the user for approval. Wait for their response before proceeding.

Plan summary:
${input.sections.map((s, i) => `${i + 1}. ${s.title}: ${s.tasks.length} tasks`).join('\n')}`;
        }
    }
];
