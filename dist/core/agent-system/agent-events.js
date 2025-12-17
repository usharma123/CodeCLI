import { EventEmitter } from "events";
/**
 * Central event emitter for multi-agent system
 * Provides real-time updates for UI components
 */
export class AgentEventEmitter extends EventEmitter {
    statusHistory = new Map();
    taskHistory = new Map();
    communicationHistory = [];
    metricsCache = new Map();
    maxHistoryPerAgent = 100;
    maxCommunicationHistory = 200;
    constructor() {
        super();
        this.setMaxListeners(50);
    }
    /**
     * Emit agent status change
     */
    emitAgentStatus(event) {
        // Store in history
        const history = this.statusHistory.get(event.agentId) || [];
        history.push(event);
        if (history.length > this.maxHistoryPerAgent) {
            history.shift(); // Remove oldest
        }
        this.statusHistory.set(event.agentId, history);
        // Emit events
        this.emit("agent:status", event);
        this.emit(`agent:${event.agentId}:status`, event);
    }
    /**
     * Emit agent task event
     */
    emitTaskEvent(event) {
        // Store in history
        const history = this.taskHistory.get(event.agentId) || [];
        history.push(event);
        if (history.length > this.maxHistoryPerAgent) {
            history.shift();
        }
        this.taskHistory.set(event.agentId, history);
        // Emit events
        this.emit("agent:task", event);
        this.emit(`task:${event.taskId}`, event);
        this.emit(`agent:${event.agentId}:task`, event);
    }
    /**
     * Emit agent communication event
     */
    emitCommunication(event) {
        // Store in history
        this.communicationHistory.push(event);
        if (this.communicationHistory.length > this.maxCommunicationHistory) {
            this.communicationHistory.shift();
        }
        // Emit events
        this.emit("agent:communication", event);
        this.emit(`agent:${event.fromAgentId}:communication`, event);
    }
    /**
     * Emit agent metrics update
     */
    emitMetrics(event) {
        // Cache latest metrics
        this.metricsCache.set(event.agentId, event);
        // Emit event
        this.emit("agent:metrics", event);
        this.emit(`agent:${event.agentId}:metrics`, event);
    }
    /**
     * Emit agent lifecycle event
     */
    emitLifecycle(event) {
        this.emit("agent:lifecycle", event);
        this.emit(`agent:${event.agentId}:lifecycle`, event);
    }
    /**
     * Get status history for an agent
     */
    getStatusHistory(agentId) {
        return this.statusHistory.get(agentId) || [];
    }
    /**
     * Get task history for an agent
     */
    getTaskHistory(agentId) {
        return this.taskHistory.get(agentId) || [];
    }
    /**
     * Get communication history
     */
    getCommunicationHistory(limit) {
        if (limit) {
            return this.communicationHistory.slice(-limit);
        }
        return [...this.communicationHistory];
    }
    /**
     * Get latest metrics for an agent
     */
    getMetrics(agentId) {
        return this.metricsCache.get(agentId);
    }
    /**
     * Get current status for an agent
     */
    getCurrentStatus(agentId) {
        const history = this.statusHistory.get(agentId);
        return history ? history[history.length - 1] : undefined;
    }
    /**
     * Get all active agents (agents with recent status)
     */
    getActiveAgents() {
        const now = Date.now();
        const activeThreshold = 60000; // 60 seconds
        const activeAgents = [];
        for (const [agentId, history] of this.statusHistory.entries()) {
            const latestStatus = history[history.length - 1];
            if (latestStatus && now - latestStatus.timestamp < activeThreshold) {
                activeAgents.push(agentId);
            }
        }
        return activeAgents;
    }
    /**
     * Clear history for an agent
     */
    clearAgentHistory(agentId) {
        this.statusHistory.delete(agentId);
        this.taskHistory.delete(agentId);
        this.metricsCache.delete(agentId);
    }
    /**
     * Clear all history
     */
    clearAllHistory() {
        this.statusHistory.clear();
        this.taskHistory.clear();
        this.communicationHistory = [];
        this.metricsCache.clear();
    }
}
// Global singleton agent event emitter
let agentEventsInstance = null;
/**
 * Get the global agent event emitter
 */
export const getAgentEvents = () => {
    if (!agentEventsInstance) {
        agentEventsInstance = new AgentEventEmitter();
    }
    return agentEventsInstance;
};
/**
 * Subscribe to agent status events
 */
export const onAgentStatus = (listener) => {
    const emitter = getAgentEvents();
    emitter.on("agent:status", listener);
    return () => emitter.off("agent:status", listener);
};
/**
 * Subscribe to agent task events
 */
export const onAgentTask = (listener) => {
    const emitter = getAgentEvents();
    emitter.on("agent:task", listener);
    return () => emitter.off("agent:task", listener);
};
/**
 * Subscribe to agent communication events
 */
export const onAgentCommunication = (listener) => {
    const emitter = getAgentEvents();
    emitter.on("agent:communication", listener);
    return () => emitter.off("agent:communication", listener);
};
/**
 * Subscribe to agent metrics events
 */
export const onAgentMetrics = (listener) => {
    const emitter = getAgentEvents();
    emitter.on("agent:metrics", listener);
    return () => emitter.off("agent:metrics", listener);
};
/**
 * Subscribe to agent lifecycle events
 */
export const onAgentLifecycle = (listener) => {
    const emitter = getAgentEvents();
    emitter.on("agent:lifecycle", listener);
    return () => emitter.off("agent:lifecycle", listener);
};
/**
 * Reset agent events (for testing)
 */
export const resetAgentEvents = () => {
    if (agentEventsInstance) {
        agentEventsInstance.clearAllHistory();
        agentEventsInstance.removeAllListeners();
    }
    agentEventsInstance = null;
};
