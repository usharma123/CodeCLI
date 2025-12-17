import { getAgentManager } from "./agent-manager.js";
import { isParallelToolsEnabled, getMaxConcurrentAgents } from "./feature-flags.js";
/**
 * TaskScheduler - Manages parallel task execution with dependency resolution
 * Uses topological sort to identify independent tasks that can run in parallel
 */
export class TaskScheduler {
    graph = new Map();
    results = new Map();
    maxConcurrent;
    constructor(maxConcurrent) {
        this.maxConcurrent = maxConcurrent || getMaxConcurrentAgents();
    }
    /**
     * Add a task to the scheduler
     */
    addTask(task) {
        const node = {
            task,
            dependencies: new Set(task.dependencies || []),
            dependents: new Set(),
        };
        this.graph.set(task.id, node);
        // Update dependents for dependencies
        for (const depId of node.dependencies) {
            const depNode = this.graph.get(depId);
            if (depNode) {
                depNode.dependents.add(task.id);
            }
            else {
                // Dependency not yet added - will be handled when it's added
                console.warn(`Task ${task.id} depends on ${depId} which hasn't been added yet`);
            }
        }
        // Update dependencies for tasks that depend on this one
        for (const [otherId, otherNode] of this.graph.entries()) {
            if (otherNode.dependencies.has(task.id)) {
                node.dependents.add(otherId);
            }
        }
        // Update dependents for dependencies
        for (const depId of node.dependencies) {
            const depNode = this.graph.get(depId);
            if (depNode) {
                depNode.dependents.add(task.id);
            }
            else {
                // Dependency not yet added - will be handled when it's added
                console.warn(`Task ${task.id} depends on ${depId} which hasn't been added yet`);
            }
        }
        // Update dependencies for tasks that depend on this one
        for (const [otherId, otherNode] of this.graph.entries()) {
            if (otherNode.dependencies.has(task.id)) {
                node.dependents.add(otherId);
            }
        }
    }
    /**
     * Build batches of independent tasks using topological sort
     * Returns array of task ID batches that can be executed in parallel
     */
    buildExecutionPlan() {
        // Calculate in-degrees (number of dependencies)
        const inDegree = new Map();
        for (const [taskId, node] of this.graph.entries()) {
            inDegree.set(taskId, node.dependencies.size);
        }
        const batches = [];
        const processed = new Set();
        while (processed.size < this.graph.size) {
            // Find all tasks with in-degree 0 (no unmet dependencies)
            const batch = [];
            for (const [taskId, degree] of inDegree.entries()) {
                if (degree === 0 && !processed.has(taskId)) {
                    batch.push(taskId);
                }
            }
            if (batch.length === 0) {
                // Circular dependency or error
                const remaining = Array.from(this.graph.keys()).filter((id) => !processed.has(id));
                throw new Error(`Circular dependency detected or unreachable tasks: ${remaining.join(", ")}`);
            }
            batches.push(batch);
            // Mark as processed and update in-degrees
            for (const taskId of batch) {
                processed.add(taskId);
                const node = this.graph.get(taskId);
                if (node) {
                    for (const dependent of node.dependents) {
                        const currentDegree = inDegree.get(dependent) || 0;
                        inDegree.set(dependent, currentDegree - 1);
                    }
                }
            }
        }
        return batches;
    }
    /**
     * Execute a single task
     */
    async executeTask(taskId) {
        const node = this.graph.get(taskId);
        if (!node) {
            throw new Error(`Task ${taskId} not found in graph`);
        }
        const agentManager = getAgentManager();
        const startTime = Date.now();
        const result = await agentManager.delegate({
            taskId: node.task.id,
            targetAgent: node.task.type,
            task: node.task,
        });
        const endTime = Date.now();
        return {
            taskId,
            result,
            startTime,
            endTime,
        };
    }
    /**
     * Execute tasks in parallel batches with concurrency limit
     */
    async executeTasks() {
        if (!isParallelToolsEnabled()) {
            // Fallback to sequential execution
            return await this.executeSequentially();
        }
        const batches = this.buildExecutionPlan();
        const results = new Map();
        for (const batch of batches) {
            // Split batch into chunks based on concurrency limit
            const chunks = [];
            for (let i = 0; i < batch.length; i += this.maxConcurrent) {
                chunks.push(batch.slice(i, i + this.maxConcurrent));
            }
            // Execute each chunk in parallel
            for (const chunk of chunks) {
                const promises = chunk.map((taskId) => this.executeTask(taskId));
                const chunkResults = await Promise.all(promises);
                for (const execResult of chunkResults) {
                    results.set(execResult.taskId, execResult.result);
                    this.results.set(execResult.taskId, execResult);
                }
            }
        }
        return results;
    }
    /**
     * Execute tasks sequentially (fallback when parallel is disabled)
     */
    async executeSequentially() {
        const results = new Map();
        const batches = this.buildExecutionPlan();
        for (const batch of batches) {
            for (const taskId of batch) {
                const execResult = await this.executeTask(taskId);
                results.set(execResult.taskId, execResult.result);
                this.results.set(execResult.taskId, execResult);
            }
        }
        return results;
    }
    /**
     * Get execution metrics
     */
    getMetrics() {
        const taskResults = Array.from(this.results.values());
        if (taskResults.length === 0) {
            return {
                totalTasks: 0,
                totalDuration: 0,
                averageDuration: 0,
                longestTask: null,
            };
        }
        const durations = taskResults.map((r) => r.endTime - r.startTime);
        const totalDuration = Math.max(...taskResults.map((r) => r.endTime)) -
            Math.min(...taskResults.map((r) => r.startTime));
        const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
        const longestIdx = durations.indexOf(Math.max(...durations));
        const longestTask = {
            taskId: taskResults[longestIdx].taskId,
            duration: durations[longestIdx],
        };
        return {
            totalTasks: taskResults.length,
            totalDuration,
            averageDuration,
            longestTask,
        };
    }
    /**
     * Get task result
     */
    getResult(taskId) {
        return this.results.get(taskId);
    }
    /**
     * Clear all tasks and results
     */
    clear() {
        this.graph.clear();
        this.results.clear();
    }
}
/**
 * Helper function to create and execute tasks in parallel
 */
export async function executeTasksInParallel(tasks) {
    const scheduler = new TaskScheduler();
    for (const task of tasks) {
        scheduler.addTask(task);
    }
    return await scheduler.executeTasks();
}
