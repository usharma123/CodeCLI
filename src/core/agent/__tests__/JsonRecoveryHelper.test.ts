import { describe, it, expect, beforeEach } from "bun:test";
import { JsonRecoveryHelper } from "../JsonRecoveryHelper.js";

describe("JsonRecoveryHelper", () => {
  let helper: JsonRecoveryHelper;

  beforeEach(() => {
    helper = new JsonRecoveryHelper();
  });

  describe("detectWriteFileTruncation", () => {
    it("should detect truncation when path exists but content is missing", () => {
      const rawArgs = '{"path": "test.txt"';
      const result = helper.detectWriteFileTruncation(rawArgs);

      expect(result.wasTruncated).toBe(true);
      expect(result.truncationInfo).toContain("content");
    });

    it("should detect truncation when content key exists but value is incomplete", () => {
      const rawArgs = '{"path": "test.txt", "content": "Hello wo';
      const result = helper.detectWriteFileTruncation(rawArgs);

      expect(result.wasTruncated).toBe(true);
      expect(result.truncationInfo).toContain("truncated");
    });

    it("should not detect truncation for valid JSON", () => {
      const rawArgs = '{"path": "test.txt", "content": "Hello world"}';
      const result = helper.detectWriteFileTruncation(rawArgs);

      expect(result.wasTruncated).toBe(false);
    });
  });

  describe("fixMalformedJson", () => {
    it("should remove trailing commas", () => {
      const rawArgs = '{"name": "test",}';
      const fixed = helper.fixMalformedJson(rawArgs, false);

      expect(fixed).toBe('{"name": "test"}');
    });

    it("should add missing closing braces", () => {
      const rawArgs = '{"name": "test"';
      const fixed = helper.fixMalformedJson(rawArgs, false);

      expect(fixed).toBe('{"name": "test"}');
    });

    it("should add missing closing brackets", () => {
      const rawArgs = '{"items": [1, 2, 3';
      const fixed = helper.fixMalformedJson(rawArgs, false);

      // Brackets/braces are closed in correct LIFO order for valid JSON
      expect(fixed).toBe('{"items": [1, 2, 3]}');
    });

    it("should add missing closing quotes", () => {
      const rawArgs = '{"name": "test';
      const fixed = helper.fixMalformedJson(rawArgs, false);

      expect(fixed).toBe('{"name": "test"}');
    });

    it("should handle multiple fixes", () => {
      const rawArgs = '{"name": "test", "items": [1, 2';
      const fixed = helper.fixMalformedJson(rawArgs, false);

      // Brackets/braces are closed in correct LIFO order for valid JSON
      expect(fixed).toBe('{"name": "test", "items": [1, 2]}');
    });

    it("should return non-strings as-is", () => {
      const rawArgs = { name: "test" };
      const fixed = helper.fixMalformedJson(rawArgs as any, false);

      expect(fixed).toEqual({ name: "test" });
    });
  });

  describe("parseAndFixJson", () => {
    it("should parse valid JSON", () => {
      const rawArgs = '{"name": "test", "value": 42}';
      const result = helper.parseAndFixJson(rawArgs, "test_tool", false);

      expect(result.success).toBe(true);
      expect(result.args).toEqual({ name: "test", value: 42 });
    });

    it("should parse and fix malformed JSON", () => {
      const rawArgs = '{"name": "test"';
      const result = helper.parseAndFixJson(rawArgs, "test_tool", false);

      expect(result.success).toBe(true);
      expect(result.args).toEqual({ name: "test" });
    });

    it("should return object input as-is", () => {
      const rawArgs = { name: "test" };
      const result = helper.parseAndFixJson(rawArgs, "test_tool", false);

      expect(result.success).toBe(true);
      expect(result.args).toEqual({ name: "test" });
    });

    it("should detect truncation for write_file", () => {
      const rawArgs = '{"path": "test.txt"';
      const result = helper.parseAndFixJson(rawArgs, "write_file", false);

      expect(result.success).toBe(true);
      expect(result.wasTruncated).toBe(true);
    });

    it("should not detect truncation for other tools", () => {
      const rawArgs = '{"path": "test.txt"';
      const result = helper.parseAndFixJson(rawArgs, "read_file", false);

      expect(result.success).toBe(true);
      expect(result.wasTruncated).toBeFalsy();
    });

    it("should return error for unparseable JSON", () => {
      const rawArgs = 'not json at all {{{';
      const result = helper.parseAndFixJson(rawArgs, "test_tool", false);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("generateTruncationErrorMessage", () => {
    it("should include truncation info", () => {
      const functionArgs = { path: "test.txt" };
      const truncationInfo = "Content was truncated";
      const message = helper.generateTruncationErrorMessage(functionArgs, truncationInfo);

      expect(message).toContain("TRUNCATION ERROR");
      expect(message).toContain("Content was truncated");
      expect(message).toContain("test.txt");
    });

    it("should include example of valid call", () => {
      const message = helper.generateTruncationErrorMessage({}, "");

      expect(message).toContain("Example of valid write_file call");
      expect(message).toContain('"path"');
      expect(message).toContain('"content"');
    });
  });

  describe("generateParseErrorMessage", () => {
    it("should include function name and error", () => {
      const message = helper.generateParseErrorMessage(
        "write_file",
        '{"bad": json}',
        "Unexpected token"
      );

      expect(message).toContain("JSON Parse Error");
      expect(message).toContain("Unexpected token");
      expect(message).toContain("write_file");
    });

    it("should include the malformed JSON", () => {
      const rawArgs = '{"bad": json}';
      const message = helper.generateParseErrorMessage("test", rawArgs, "error");

      expect(message).toContain(rawArgs);
    });

    it("should include fixing instructions", () => {
      const message = helper.generateParseErrorMessage("test", "{}", "error");

      expect(message).toContain("double quotes");
      expect(message).toContain("braces {} and brackets []");
      expect(message).toContain("trailing commas");
    });
  });
});
