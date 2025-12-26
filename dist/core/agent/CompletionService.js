/**
 * CompletionService - Handles OpenAI API calls and streaming
 *
 * Single Responsibility: API communication with OpenAI/OpenRouter
 */
import OpenAI from "openai";
import { colors } from "../../utils/colors.js";
import { isDebugAPIEnabled } from "../feature-flags.js";
export class CompletionService {
    client;
    retryCount = 0;
    maxRetries = 3;
    streamAssistantResponses;
    model;
    constructor(options) {
        this.client = new OpenAI({
            apiKey: options.apiKey,
            baseURL: options.baseURL,
            defaultHeaders: {
                "HTTP-Referer": "https://github.com/yourusername/ai-coding-agent",
                "X-Title": "AI Coding Agent",
            },
            timeout: options.timeout,
        });
        this.streamAssistantResponses = options.streamAssistantResponses;
        this.model = options.model;
    }
    /**
     * Get the OpenAI client for use by other services
     */
    getClient() {
        return this.client;
    }
    /**
     * Get the model name
     */
    getModel() {
        return this.model;
    }
    /**
     * Reset retry count (called on new user input)
     */
    resetRetryCount() {
        this.retryCount = 0;
    }
    /**
     * Check if we should retry based on error and retry count
     */
    shouldRetry(error) {
        const retryableStatuses = [429, 500, 502, 503, 504];
        return error?.status && retryableStatuses.includes(error.status) && this.retryCount < this.maxRetries;
    }
    /**
     * Increment retry count and get delay for backoff
     */
    incrementRetry() {
        this.retryCount++;
        const delay = Math.min(1000 * Math.pow(2, this.retryCount - 1), 10000); // Max 10 seconds
        return { attempt: this.retryCount, delay };
    }
    /**
     * Get current retry info
     */
    getRetryInfo() {
        return { count: this.retryCount, max: this.maxRetries };
    }
    /**
     * Create a chat completion (streaming or non-streaming)
     */
    async createCompletion(request) {
        const start = Date.now();
        // Log request size for debugging context issues
        this.logRequestDebugInfo(request);
        try {
            if (!this.streamAssistantResponses) {
                return await this.createNonStreamingCompletion(request, start);
            }
            return await this.createStreamingCompletion(request, start);
        }
        catch (error) {
            this.logApiError(error, request);
            throw error;
        }
    }
    /**
     * Log request debug info when DEBUG_API is enabled
     */
    logRequestDebugInfo(request) {
        if (!isDebugAPIEnabled())
            return;
        const estimatedTokens = this.estimateRequestTokens(request);
        const messageCount = request.messages?.length ?? 0;
        const toolCount = request.tools?.length ?? 0;
        console.log(`${colors.gray}─── API Request Debug ───${colors.reset}`);
        console.log(`${colors.gray}  Model: ${request.model}${colors.reset}`);
        console.log(`${colors.gray}  Messages: ${messageCount}${colors.reset}`);
        console.log(`${colors.gray}  Tools: ${toolCount}${colors.reset}`);
        console.log(`${colors.gray}  Estimated tokens: ${estimatedTokens.toLocaleString()}${colors.reset}`);
        // Warn if approaching common context limits
        if (estimatedTokens > 100000) {
            console.log(`${colors.yellow}  ⚠️  Warning: Request may exceed context limit (${estimatedTokens.toLocaleString()} tokens)${colors.reset}`);
        }
        else if (estimatedTokens > 50000) {
            console.log(`${colors.yellow}  ⚠️  Large request: ${estimatedTokens.toLocaleString()} tokens${colors.reset}`);
        }
        console.log(`${colors.gray}──────────────────────────${colors.reset}`);
    }
    /**
     * Create a non-streaming completion
     */
    async createNonStreamingCompletion(request, startTime) {
        const completion = await this.client.chat.completions.create(request);
        // Validate response - API may return undefined on context overflow or errors
        if (!completion) {
            const estimatedTokens = this.estimateRequestTokens(request);
            throw new Error(`API returned undefined response. This may indicate context limit exceeded. ` +
                `Estimated request tokens: ${estimatedTokens.toLocaleString()}`);
        }
        if (!completion.choices || completion.choices.length === 0) {
            throw new Error(`API returned empty choices array. Response: ${JSON.stringify(completion, null, 2)}`);
        }
        const message = completion.choices[0].message;
        if (!message) {
            throw new Error(`API returned null message in choices[0]. Response: ${JSON.stringify(completion, null, 2)}`);
        }
        const content = message.content ?? "";
        const reasoningDetails = message.reasoning_details;
        return {
            message: message,
            elapsedSeconds: (Date.now() - startTime) / 1000,
            streamedContent: content,
            reasoningDetails,
        };
    }
    /**
     * Create a streaming completion
     */
    async createStreamingCompletion(request, startTime) {
        const stream = await this.client.chat.completions.create({
            ...request,
            stream: true,
        });
        // Validate stream - API may return undefined on context overflow or errors
        if (!stream) {
            const estimatedTokens = this.estimateRequestTokens(request);
            throw new Error(`API returned undefined stream. This may indicate context limit exceeded. ` +
                `Estimated request tokens: ${estimatedTokens.toLocaleString()}`);
        }
        let content = "";
        const toolCallsByIndex = [];
        const reasoningDetailsByIndex = [];
        for await (const chunk of stream) {
            const delta = chunk.choices?.[0]?.delta;
            if (!delta)
                continue;
            if (delta.content) {
                content += delta.content;
                process.stdout.write(delta.content);
            }
            // Accumulate reasoning_details from delta chunks (OpenRouter extension)
            if (delta.reasoning_details) {
                this.accumulateReasoningDetails(delta.reasoning_details, reasoningDetailsByIndex);
            }
            if (delta.tool_calls) {
                this.accumulateToolCalls(delta.tool_calls, toolCallsByIndex);
            }
        }
        process.stdout.write("\n");
        // Build message from accumulated data
        const message = this.buildMessageFromStream(content, toolCallsByIndex, reasoningDetailsByIndex);
        const reasoningDetails = this.buildReasoningDetails(reasoningDetailsByIndex);
        return {
            message,
            elapsedSeconds: (Date.now() - startTime) / 1000,
            streamedContent: content,
            reasoningDetails: reasoningDetails.length > 0 ? reasoningDetails : undefined,
        };
    }
    /**
     * Accumulate reasoning details from streaming delta
     */
    accumulateReasoningDetails(details, accumulator) {
        for (const detail of details) {
            const index = detail.index ?? 0;
            if (!accumulator[index]) {
                accumulator[index] = {
                    type: detail.type,
                    id: detail.id,
                    format: detail.format,
                    index: index,
                    text: "",
                    summary: "",
                    data: "",
                    signature: detail.signature,
                };
            }
            if (detail.text) {
                accumulator[index].text += detail.text;
            }
            if (detail.summary) {
                accumulator[index].summary += detail.summary;
            }
            if (detail.data) {
                accumulator[index].data += detail.data;
            }
            if (detail.id)
                accumulator[index].id = detail.id;
            if (detail.type)
                accumulator[index].type = detail.type;
            if (detail.signature)
                accumulator[index].signature = detail.signature;
        }
    }
    /**
     * Accumulate tool calls from streaming delta
     */
    accumulateToolCalls(calls, accumulator) {
        for (const call of calls) {
            const index = call.index ?? 0;
            if (!accumulator[index]) {
                accumulator[index] = {
                    id: call.id,
                    type: call.type ?? "function",
                    function: { name: "", arguments: "" },
                };
            }
            if (call.id)
                accumulator[index].id = call.id;
            if (call.function?.name) {
                accumulator[index].function.name = call.function.name;
            }
            if (call.function?.arguments) {
                accumulator[index].function.arguments += call.function.arguments;
            }
        }
    }
    /**
     * Build message from streamed content and tool calls
     */
    buildMessageFromStream(content, toolCallsByIndex, reasoningDetailsByIndex) {
        const message = { role: "assistant" };
        if (content)
            message.content = content;
        const toolCalls = toolCallsByIndex.filter(Boolean);
        if (toolCalls.length > 0) {
            message.tool_calls = toolCalls;
        }
        const reasoningDetails = this.buildReasoningDetails(reasoningDetailsByIndex);
        if (reasoningDetails.length > 0) {
            message.reasoning_details = reasoningDetails;
        }
        return message;
    }
    /**
     * Build final reasoning details array from accumulated data
     */
    buildReasoningDetails(accumulator) {
        return accumulator.filter(Boolean).map(detail => {
            const cleaned = {
                type: detail.type,
                id: detail.id,
                format: detail.format,
                index: detail.index,
            };
            if (detail.type === "reasoning.text" && detail.text) {
                cleaned.text = detail.text;
                cleaned.signature = detail.signature;
            }
            else if (detail.type === "reasoning.summary" && detail.summary) {
                cleaned.summary = detail.summary;
            }
            else if (detail.type === "reasoning.encrypted" && detail.data) {
                cleaned.data = detail.data;
            }
            return cleaned;
        });
    }
    /**
     * Estimate tokens in a request for diagnostic purposes
     */
    estimateRequestTokens(request) {
        let totalChars = 0;
        if (request.messages) {
            for (const msg of request.messages) {
                const content = msg.content;
                if (typeof content === "string") {
                    totalChars += content.length;
                }
                else if (Array.isArray(content)) {
                    // Handle multi-modal content (text + images)
                    for (const part of content) {
                        if (part.type === "text" && part.text) {
                            totalChars += part.text.length;
                        }
                    }
                }
            }
        }
        // Rough estimate: ~4 chars per token
        return Math.ceil(totalChars / 4);
    }
    /**
     * Log comprehensive API error information
     */
    logApiError(error, request) {
        console.error(`\n${colors.red}═══ API Error Details ═══${colors.reset}`);
        console.error(`Status: ${error?.status || 'unknown'}`);
        console.error(`Message: ${error?.message || 'no message'}`);
        if (error?.error) {
            console.error(`\nRaw API Error:`);
            console.error(JSON.stringify(error.error, null, 2));
        }
        // Special handling for tool validation errors (400 status)
        if (error?.status === 400 && (error?.message?.includes('tool') ||
            error?.message?.includes('parameter') ||
            error?.message?.includes('schema'))) {
            console.error(`\n${colors.yellow}Tool Validation Failed${colors.reset}`);
            console.error(`This suggests the tool call JSON doesn't match the API's expected schema.`);
            if (request.tools && request.tools.length > 0) {
                console.error(`\nTools in request: ${request.tools.map((t) => t.function.name).join(', ')}`);
            }
        }
        console.error(`${colors.red}═══════════════════════${colors.reset}\n`);
    }
}
