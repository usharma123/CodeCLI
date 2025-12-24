import { describe, it, expect, beforeEach, mock } from "bun:test";
import { ToolExecutor } from "../ToolExecutor.js";
describe("ToolExecutor", () => {
    let executor;
    let mockTools;
    beforeEach(() => {
        mockTools = [
            {
                name: "test_tool",
                description: "A test tool for testing",
                parameters: {
                    type: "object",
                    properties: {
                        input: { type: "string", description: "Test input" },
                    },
                    required: ["input"],
                    additionalProperties: false,
                },
                function: mock(async (args) => `Result: ${args.input}`),
            },
            {
                name: "write_file",
                description: "Write a file to disk",
                parameters: {
                    type: "object",
                    properties: {
                        path: { type: "string" },
                        content: { type: "string" },
                    },
                    required: ["path", "content"],
                    additionalProperties: false,
                },
                function: mock(async (args) => `Wrote to ${args.path}`),
            },
        ];
        executor = new ToolExecutor({
            tools: mockTools,
            verboseTools: false,
            maxToolOutputChars: 1000,
        });
    });
    describe("getTools", () => {
        it("should return the tool definitions", () => {
            expect(executor.getTools()).toEqual(mockTools);
        });
    });
    describe("getOpenAITools", () => {
        it("should convert tools to OpenAI format", () => {
            const openAITools = executor.getOpenAITools();
            expect(openAITools).toHaveLength(2);
            expect(openAITools[0].type).toBe("function");
            expect(openAITools[0].function.name).toBe("test_tool");
            expect(openAITools[0].function.description).toBe("A test tool for testing");
            expect(openAITools[0].function.parameters).toBeDefined();
        });
    });
    describe("validateToolSchemas", () => {
        it("should validate all tools without issues", () => {
            const result = executor.validateToolSchemas();
            expect(result.valid).toBe(true);
            expect(result.issues.filter(i => i.includes("❌"))).toHaveLength(0);
        });
        it("should detect missing additionalProperties", () => {
            const toolsWithMissingProp = [
                {
                    name: "bad_tool",
                    description: "Missing additionalProperties",
                    parameters: {
                        type: "object",
                        properties: { x: { type: "string" } },
                    },
                    function: async () => "result",
                },
            ];
            const badExecutor = new ToolExecutor({
                tools: toolsWithMissingProp,
                verboseTools: false,
                maxToolOutputChars: 1000,
            });
            const result = badExecutor.validateToolSchemas();
            expect(result.issues.some(i => i.includes("additionalProperties"))).toBe(true);
        });
        it("should detect undefined required properties", () => {
            const toolsWithBadRequired = [
                {
                    name: "bad_tool",
                    description: "Has undefined required property",
                    parameters: {
                        type: "object",
                        properties: { x: { type: "string" } },
                        required: ["y"],
                        additionalProperties: false,
                    },
                    function: async () => "result",
                },
            ];
            const badExecutor = new ToolExecutor({
                tools: toolsWithBadRequired,
                verboseTools: false,
                maxToolOutputChars: 1000,
            });
            const result = badExecutor.validateToolSchemas();
            expect(result.valid).toBe(false);
            expect(result.issues.some(i => i.includes("❌"))).toBe(true);
        });
    });
    describe("executeToolCalls", () => {
        it("should execute a single tool call", async () => {
            const toolCalls = [
                {
                    id: "call_1",
                    type: "function",
                    function: {
                        name: "test_tool",
                        arguments: '{"input": "hello"}',
                    },
                },
            ];
            const results = await executor.executeToolCalls(toolCalls);
            expect(results).toHaveLength(1);
            expect(results[0].tool_call_id).toBe("call_1");
            expect(results[0].role).toBe("tool");
            expect(results[0].content).toBe("Result: hello");
        });
        it("should execute multiple tool calls", async () => {
            const toolCalls = [
                {
                    id: "call_1",
                    type: "function",
                    function: {
                        name: "test_tool",
                        arguments: '{"input": "first"}',
                    },
                },
                {
                    id: "call_2",
                    type: "function",
                    function: {
                        name: "test_tool",
                        arguments: '{"input": "second"}',
                    },
                },
            ];
            const results = await executor.executeToolCalls(toolCalls);
            expect(results).toHaveLength(2);
            expect(results[0].content).toBe("Result: first");
            expect(results[1].content).toBe("Result: second");
        });
        it("should handle unknown tool gracefully", async () => {
            const toolCalls = [
                {
                    id: "call_1",
                    type: "function",
                    function: {
                        name: "unknown_tool",
                        arguments: "{}",
                    },
                },
            ];
            const results = await executor.executeToolCalls(toolCalls);
            expect(results).toHaveLength(1);
            expect(results[0].content).toContain("Unknown tool");
            expect(results[0].content).toContain("unknown_tool");
        });
        it("should handle malformed JSON arguments", async () => {
            const toolCalls = [
                {
                    id: "call_1",
                    type: "function",
                    function: {
                        name: "test_tool",
                        arguments: 'not valid json',
                    },
                },
            ];
            const results = await executor.executeToolCalls(toolCalls);
            expect(results).toHaveLength(1);
            expect(results[0].content).toContain("JSON Parse Error");
        });
        it("should fix and parse slightly malformed JSON", async () => {
            const toolCalls = [
                {
                    id: "call_1",
                    type: "function",
                    function: {
                        name: "test_tool",
                        arguments: '{"input": "test"', // Missing closing brace
                    },
                },
            ];
            const results = await executor.executeToolCalls(toolCalls);
            expect(results).toHaveLength(1);
            expect(results[0].content).toBe("Result: test");
        });
        it("should validate write_file requires path and content", async () => {
            const toolCalls = [
                {
                    id: "call_1",
                    type: "function",
                    function: {
                        name: "write_file",
                        arguments: '{"path": "test.txt"}', // Missing content
                    },
                },
            ];
            const results = await executor.executeToolCalls(toolCalls);
            expect(results).toHaveLength(1);
            expect(results[0].content).toContain("Validation Error");
            expect(results[0].content).toContain("content");
        });
        it("should detect truncated write_file calls", async () => {
            const toolCalls = [
                {
                    id: "call_1",
                    type: "function",
                    function: {
                        name: "write_file",
                        arguments: '{"path": "test.txt"', // Truncated before content
                    },
                },
            ];
            const results = await executor.executeToolCalls(toolCalls);
            expect(results).toHaveLength(1);
            expect(results[0].content).toContain("TRUNCATION ERROR");
        });
    });
});
