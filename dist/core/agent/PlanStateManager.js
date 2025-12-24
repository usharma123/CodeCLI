/**
 * PlanStateManager - Manages plan mode state and approval workflow
 *
 * Single Responsibility: Plan state management and approval workflow
 */
export class PlanStateManager {
    state;
    constructor() {
        this.state = {
            plan: null,
            status: "idle",
            lastUpdated: 0
        };
    }
    /**
     * Get the complete plan state
     */
    getState() {
        return this.state;
    }
    /**
     * Get the current plan, if any
     */
    getPlan() {
        return this.state.plan;
    }
    /**
     * Get the current plan status
     */
    getStatus() {
        return this.state.status;
    }
    /**
     * Update the plan (sets status to pending_approval)
     */
    updatePlan(plan) {
        this.state = {
            plan,
            status: "pending_approval",
            lastUpdated: Date.now()
        };
    }
    /**
     * Clear the current plan (resets to idle)
     */
    clearPlan() {
        this.state = {
            plan: null,
            status: "idle",
            lastUpdated: Date.now()
        };
    }
    /**
     * Approve the plan and convert sections to todo items
     * Returns the generated todo items
     */
    approve() {
        if (!this.state.plan) {
            return [];
        }
        // Convert plan sections to todos
        const todos = [];
        for (const section of this.state.plan.sections) {
            for (const task of section.tasks) {
                todos.push({
                    content: task,
                    activeForm: this.convertToActiveForm(task),
                    status: "pending"
                });
            }
        }
        // Set first todo to in_progress
        if (todos.length > 0) {
            todos[0].status = "in_progress";
        }
        // Mark plan as approved
        this.state.status = "approved";
        this.state.lastUpdated = Date.now();
        return todos;
    }
    /**
     * Reject the plan
     */
    reject() {
        this.state = {
            plan: null,
            status: "rejected",
            lastUpdated: Date.now()
        };
    }
    /**
     * Request modification to the plan
     */
    requestModification(instructions) {
        this.state.status = "modifying";
        this.state.modificationRequest = instructions;
        this.state.lastUpdated = Date.now();
        // Clear the plan to allow a new one to be created
        this.state.plan = null;
    }
    /**
     * Convert a task description to its active/progressive form
     * "Add user model" -> "Adding user model"
     */
    convertToActiveForm(task) {
        const mapping = {
            'Add': 'Adding',
            'Create': 'Creating',
            'Implement': 'Implementing',
            'Update': 'Updating',
            'Fix': 'Fixing',
            'Remove': 'Removing',
            'Write': 'Writing',
            'Build': 'Building',
            'Set up': 'Setting up',
            'Setup': 'Setting up',
            'Configure': 'Configuring',
            'Install': 'Installing',
            'Test': 'Testing',
            'Refactor': 'Refactoring',
            'Delete': 'Deleting',
            'Move': 'Moving',
            'Rename': 'Renaming',
            'Extract': 'Extracting',
            'Merge': 'Merging',
            'Split': 'Splitting'
        };
        return task.replace(/^(Add|Create|Implement|Update|Fix|Remove|Write|Build|Set up|Setup|Configure|Install|Test|Refactor|Delete|Move|Rename|Extract|Merge|Split)/i, (match) => {
            const key = Object.keys(mapping).find(k => k.toLowerCase() === match.toLowerCase());
            return key ? mapping[key] : match + 'ing';
        });
    }
}
