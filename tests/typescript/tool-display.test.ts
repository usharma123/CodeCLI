import { describe, expect, it } from "bun:test";
import { formatToolArgs, formatToolName } from "../../src/core/tool-display.js";

describe("tool display formatters", () => {
  it("formatToolArgs handles undefined args", () => {
    expect(formatToolArgs("generate_mermaid_diagram", undefined)).toBe(".");
    expect(formatToolArgs("todo_write", undefined)).toBe("0 todos");
    expect(formatToolArgs("read_file", undefined)).toBe("");
    expect(formatToolArgs("list_files", undefined)).toBe(".");
    expect(formatToolArgs("run_command", undefined)).toBe("");
    expect(formatToolArgs("unknown_tool", undefined)).toBe("{}");
  });

  it("formatToolName uses friendly names", () => {
    expect(formatToolName("generate_mermaid_diagram")).toBe("Diagram");
    expect(formatToolName("read_file")).toBe("Read");
  });
});

