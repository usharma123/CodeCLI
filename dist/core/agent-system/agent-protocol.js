/**
 * Generate unique task ID
 */
export const generateTaskId = () => {
    return `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};
/**
 * Create a standard AgentTask
 */
export const createAgentTask = (type, description, context = {}, options = {}) => {
    return {
        id: generateTaskId(),
        type,
        description,
        context,
        priority: options.priority || "normal",
        timeout: options.timeout,
        dependencies: options.dependencies,
    };
};
/**
 * Create a standard AgentResult
 */
export const createAgentResult = (taskId, status, data, metrics, error) => {
    return {
        taskId,
        status,
        data,
        error,
        metrics: {
            duration: metrics.duration,
            toolCallCount: metrics.toolCallCount || 0,
            tokensUsed: metrics.tokensUsed || 0,
        },
    };
};
