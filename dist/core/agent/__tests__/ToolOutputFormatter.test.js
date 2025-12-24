import { describe, it, expect, beforeEach } from "bun:test";
import { ToolOutputFormatter } from "../ToolOutputFormatter.js";
describe("ToolOutputFormatter", () => {
    describe("with verboseTools=false", () => {
        let formatter;
        beforeEach(() => {
            formatter = new ToolOutputFormatter({
                verboseTools: false,
                maxToolOutputChars: 100,
            });
        });
        describe("shouldShowOutput", () => {
            it("should return true for default output tools", () => {
                expect(formatter.shouldShowOutput("run_command")).toBe(true);
                expect(formatter.shouldShowOutput("run_tests")).toBe(true);
                expect(formatter.shouldShowOutput("get_coverage")).toBe(true);
                expect(formatter.shouldShowOutput("todo_write")).toBe(true);
                expect(formatter.shouldShowOutput("generate_mermaid_diagram")).toBe(true);
            });
            it("should return false for non-default tools", () => {
                expect(formatter.shouldShowOutput("read_file")).toBe(false);
                expect(formatter.shouldShowOutput("write_file")).toBe(false);
                expect(formatter.shouldShowOutput("edit_file")).toBe(false);
                expect(formatter.shouldShowOutput("list_files")).toBe(false);
            });
        });
        describe("truncateText", () => {
            it("should return text unchanged if under limit", () => {
                const text = "short text";
                expect(formatter.truncateText(text, 100)).toBe("short text");
            });
            it("should truncate text over limit", () => {
                const text = "a".repeat(150);
                const truncated = formatter.truncateText(text, 100);
                expect(truncated.length).toBeLessThan(150);
                expect(truncated).toContain("truncated");
                expect(truncated).toContain("50 chars more");
            });
        });
        describe("formatForDisplay", () => {
            it("should return empty string for non-default tools", () => {
                const result = formatter.formatForDisplay("read_file", {}, "file contents");
                expect(result).toBe("");
            });
            it("should return output for default tools", () => {
                const result = formatter.formatForDisplay("run_command", {}, "command output");
                expect(result).toBe("command output");
            });
            it("should truncate long output", () => {
                const longOutput = "x".repeat(200);
                const result = formatter.formatForDisplay("run_command", {}, longOutput);
                expect(result.length).toBeLessThan(200);
                expect(result).toContain("truncated");
            });
            it("should strip streamed output sections for run_command", () => {
                const output = "result\n--- STDOUT ---\nmore output";
                const result = formatter.formatForDisplay("run_command", {}, output);
                expect(result).toBe("result");
                expect(result).not.toContain("STDOUT");
            });
        });
    });
    describe("with verboseTools=true", () => {
        let formatter;
        beforeEach(() => {
            formatter = new ToolOutputFormatter({
                verboseTools: true,
                maxToolOutputChars: 100,
            });
        });
        describe("shouldShowOutput", () => {
            it("should return true for all tools", () => {
                expect(formatter.shouldShowOutput("read_file")).toBe(true);
                expect(formatter.shouldShowOutput("write_file")).toBe(true);
                expect(formatter.shouldShowOutput("custom_tool")).toBe(true);
            });
        });
        describe("formatForDisplay", () => {
            it("should NOT truncate output", () => {
                const longOutput = "x".repeat(200);
                const result = formatter.formatForDisplay("read_file", {}, longOutput);
                expect(result).toBe(longOutput);
                expect(result).not.toContain("truncated");
            });
            it("should NOT strip streamed output sections", () => {
                const output = "result\n--- STDOUT ---\nmore output";
                const result = formatter.formatForDisplay("run_command", {}, output);
                expect(result).toBe(output);
                expect(result).toContain("STDOUT");
            });
        });
    });
    describe("edge cases", () => {
        let formatter;
        beforeEach(() => {
            formatter = new ToolOutputFormatter({
                verboseTools: false,
                maxToolOutputChars: 100,
            });
        });
        it("should handle empty output", () => {
            const result = formatter.formatForDisplay("run_command", {}, "");
            expect(result).toBe("");
        });
        it("should handle null/undefined output", () => {
            const result = formatter.formatForDisplay("run_command", {}, undefined);
            expect(result).toBe("");
        });
        it("should handle output with only whitespace", () => {
            const result = formatter.formatForDisplay("run_command", {}, "   \n\t  ");
            expect(result).toBe("   \n\t  ");
        });
    });
});
