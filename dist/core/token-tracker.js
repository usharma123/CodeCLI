import { encoding_for_model } from "tiktoken";
// OpenRouter pricing (approximate - check openrouter.ai/docs#models for latest)
export const MODEL_COSTS = {
    "google/gemini-flash-1.5": {
        model: "google/gemini-flash-1.5",
        inputCostPer1k: 0.000075,
        outputCostPer1k: 0.0003
    },
    "google/gemini-pro-1.5": {
        model: "google/gemini-pro-1.5",
        inputCostPer1k: 0.00125,
        outputCostPer1k: 0.005
    },
    "anthropic/claude-3.5-sonnet": {
        model: "anthropic/claude-3.5-sonnet",
        inputCostPer1k: 0.003,
        outputCostPer1k: 0.015
    },
    "anthropic/claude-3-opus": {
        model: "anthropic/claude-3-opus",
        inputCostPer1k: 0.015,
        outputCostPer1k: 0.075
    },
    "openai/gpt-4": {
        model: "openai/gpt-4",
        inputCostPer1k: 0.03,
        outputCostPer1k: 0.06
    },
    "openai/gpt-4-turbo": {
        model: "openai/gpt-4-turbo",
        inputCostPer1k: 0.01,
        outputCostPer1k: 0.03
    }
};
// Default fallback for unknown models
const DEFAULT_COST = {
    model: "unknown",
    inputCostPer1k: 0.001,
    outputCostPer1k: 0.002
};
export class TokenTracker {
    usage = [];
    totalInputTokens = 0;
    totalOutputTokens = 0;
    totalCost = 0;
    encoder = null;
    encoderModel = "gpt-4";
    constructor() {
        this.initializeEncoder();
    }
    initializeEncoder() {
        try {
            // Use GPT-4 encoding as a reasonable approximation for most models
            this.encoder = encoding_for_model("gpt-4");
        }
        catch (error) {
            console.warn("Failed to initialize tiktoken encoder:", error);
            this.encoder = null;
        }
    }
    /**
     * Count tokens in text using tiktoken
     */
    async countTokens(text) {
        if (!this.encoder) {
            // Fallback to rough estimation: ~4 chars per token
            return Math.ceil(text.length / 4);
        }
        try {
            const tokens = this.encoder.encode(text);
            return tokens.length;
        }
        catch (error) {
            // Fallback on error
            return Math.ceil(text.length / 4);
        }
    }
    /**
     * Estimate tokens synchronously (faster but less accurate)
     */
    estimateTokens(text) {
        // Simple estimation: average of 4 characters per token
        return Math.ceil(text.length / 4);
    }
    /**
     * Record token usage for an API call
     */
    recordUsage(usage) {
        this.usage.push(usage);
        this.totalInputTokens += usage.promptTokens;
        this.totalOutputTokens += usage.completionTokens;
        this.totalCost += usage.estimatedCost;
    }
    /**
     * Calculate cost for token usage
     */
    calculateCost(promptTokens, completionTokens, model) {
        const costConfig = MODEL_COSTS[model] || DEFAULT_COST;
        const inputCost = (promptTokens / 1000) * costConfig.inputCostPer1k;
        const outputCost = (completionTokens / 1000) * costConfig.outputCostPer1k;
        return inputCost + outputCost;
    }
    /**
     * Get total cost across all API calls
     */
    getTotalCost() {
        return this.totalCost;
    }
    /**
     * Get total tokens used
     */
    getTotalTokens() {
        return this.totalInputTokens + this.totalOutputTokens;
    }
    /**
     * Get cost breakdown
     */
    getCostBreakdown() {
        let inputCost = 0;
        let outputCost = 0;
        for (const usage of this.usage) {
            const costConfig = MODEL_COSTS[usage.model] || DEFAULT_COST;
            inputCost += (usage.promptTokens / 1000) * costConfig.inputCostPer1k;
            outputCost += (usage.completionTokens / 1000) * costConfig.outputCostPer1k;
        }
        return {
            input: inputCost,
            output: outputCost,
            total: inputCost + outputCost
        };
    }
    /**
     * Get token breakdown
     */
    getTokenBreakdown() {
        return {
            input: this.totalInputTokens,
            output: this.totalOutputTokens,
            total: this.totalInputTokens + this.totalOutputTokens
        };
    }
    /**
     * Get usage history
     */
    getUsageHistory() {
        return [...this.usage];
    }
    /**
     * Export detailed report
     */
    exportReport() {
        const breakdown = this.getCostBreakdown();
        const tokens = this.getTokenBreakdown();
        let report = "Token Usage Report\n";
        report += "==================\n\n";
        report += `Total API Calls: ${this.usage.length}\n`;
        report += `Total Tokens: ${tokens.total.toLocaleString()}\n`;
        report += `  - Input: ${tokens.input.toLocaleString()}\n`;
        report += `  - Output: ${tokens.output.toLocaleString()}\n\n`;
        report += `Estimated Cost: $${breakdown.total.toFixed(4)}\n`;
        report += `  - Input: $${breakdown.input.toFixed(4)}\n`;
        report += `  - Output: $${breakdown.output.toFixed(4)}\n\n`;
        if (this.usage.length > 0) {
            report += "Recent Calls:\n";
            const recent = this.usage.slice(-10);
            for (const usage of recent) {
                const timestamp = new Date(usage.timestamp).toLocaleTimeString();
                report += `  ${timestamp} - ${usage.model}: ${usage.totalTokens} tokens ($${usage.estimatedCost.toFixed(4)})\n`;
            }
        }
        return report;
    }
    /**
     * Reset all tracking data
     */
    reset() {
        this.usage = [];
        this.totalInputTokens = 0;
        this.totalOutputTokens = 0;
        this.totalCost = 0;
    }
    /**
     * Clean up encoder
     */
    dispose() {
        if (this.encoder) {
            this.encoder.free();
            this.encoder = null;
        }
    }
}
// Global singleton instance
let tokenTrackerInstance = null;
export function getTokenTracker() {
    if (!tokenTrackerInstance) {
        tokenTrackerInstance = new TokenTracker();
    }
    return tokenTrackerInstance;
}
export function resetTokenTracker() {
    if (tokenTrackerInstance) {
        tokenTrackerInstance.reset();
    }
}
