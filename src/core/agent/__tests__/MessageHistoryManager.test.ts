import { describe, it, expect, beforeEach, mock } from "bun:test";
import { MessageHistoryManager } from "../MessageHistoryManager.js";
import type { ChatMessage } from "../types.js";

// Mock OpenAI client
const mockClient = {
  chat: {
    completions: {
      create: mock(() => Promise.resolve({
        choices: [{ message: { content: "mocked response" } }]
      }))
    }
  }
} as any;

describe("MessageHistoryManager", () => {
  let manager: MessageHistoryManager;

  beforeEach(() => {
    manager = new MessageHistoryManager(mockClient);
  });

  describe("initialization", () => {
    it("should start with empty messages", () => {
      expect(manager.getMessages()).toEqual([]);
    });

    it("should return undefined for getSystemPrompt when empty", () => {
      expect(manager.getSystemPrompt()).toBeUndefined();
    });
  });

  describe("addMessage", () => {
    it("should add a message to history", () => {
      const message: ChatMessage = { role: "user", content: "Hello" };
      manager.addMessage(message);

      expect(manager.getMessages()).toHaveLength(1);
      expect(manager.getMessages()[0]).toEqual(message);
    });

    it("should preserve message order", () => {
      manager.addMessage({ role: "user", content: "First" });
      manager.addMessage({ role: "assistant", content: "Second" });
      manager.addMessage({ role: "user", content: "Third" });

      const messages = manager.getMessages();
      expect(messages[0].content).toBe("First");
      expect(messages[1].content).toBe("Second");
      expect(messages[2].content).toBe("Third");
    });
  });

  describe("setSystemPrompt", () => {
    it("should set system prompt as first message", () => {
      manager.setSystemPrompt("You are a helpful assistant");

      const messages = manager.getMessages();
      expect(messages[0].role).toBe("system");
      expect(messages[0].content).toBe("You are a helpful assistant");
    });

    it("should replace existing system prompt", () => {
      manager.setSystemPrompt("Original prompt");
      manager.setSystemPrompt("New prompt");

      const messages = manager.getMessages();
      expect(messages).toHaveLength(1);
      expect(messages[0].content).toBe("New prompt");
    });

    it("should insert system prompt at beginning even if messages exist", () => {
      manager.addMessage({ role: "user", content: "Hello" });
      manager.setSystemPrompt("System prompt");

      const messages = manager.getMessages();
      expect(messages[0].role).toBe("system");
      expect(messages[1].role).toBe("user");
    });
  });

  describe("getSystemPrompt", () => {
    it("should return the system prompt", () => {
      manager.setSystemPrompt("Test prompt");

      expect(manager.getSystemPrompt()?.content).toBe("Test prompt");
    });

    it("should return undefined if no system message", () => {
      manager.addMessage({ role: "user", content: "Hello" });

      expect(manager.getSystemPrompt()).toBeUndefined();
    });
  });

  describe("removeLastMessage", () => {
    it("should remove and return the last message", () => {
      manager.addMessage({ role: "user", content: "First" });
      manager.addMessage({ role: "assistant", content: "Second" });

      const removed = manager.removeLastMessage();

      expect(removed?.content).toBe("Second");
      expect(manager.getMessages()).toHaveLength(1);
    });

    it("should return undefined for empty history", () => {
      expect(manager.removeLastMessage()).toBeUndefined();
    });
  });

  describe("clear", () => {
    it("should remove all messages except system prompt", () => {
      manager.setSystemPrompt("System");
      manager.addMessage({ role: "user", content: "Hello" });
      manager.addMessage({ role: "assistant", content: "Hi" });

      manager.clear();

      const messages = manager.getMessages();
      expect(messages).toHaveLength(1);
      expect(messages[0].role).toBe("system");
    });

    it("should clear all messages if no system prompt", () => {
      manager.addMessage({ role: "user", content: "Hello" });
      manager.addMessage({ role: "assistant", content: "Hi" });

      manager.clear();

      expect(manager.getMessages()).toEqual([]);
    });
  });

  describe("estimateTokens", () => {
    it("should estimate tokens based on content length", () => {
      manager.addMessage({ role: "user", content: "Hello world" }); // 11 chars

      // Rough approximation: 1 token ≈ 4 characters
      expect(manager.estimateTokens()).toBeGreaterThan(0);
      expect(manager.estimateTokens()).toBeLessThan(10);
    });

    it("should include tool calls in estimate", () => {
      manager.addMessage({
        role: "assistant",
        content: "Using tool",
        tool_calls: [{ id: "1", type: "function", function: { name: "test", arguments: "{}" } }]
      });

      expect(manager.estimateTokens()).toBeGreaterThan(0);
    });

    it("should return 0 for empty history", () => {
      expect(manager.estimateTokens()).toBe(0);
    });
  });

  describe("trackValidationFailure", () => {
    it("should track validation failures by signature", () => {
      const attempt1 = manager.trackValidationFailure("write_file:{}");
      const attempt2 = manager.trackValidationFailure("write_file:{}");
      const attempt3 = manager.trackValidationFailure("write_file:{}");

      expect(attempt1).toBe(1);
      expect(attempt2).toBe(2);
      expect(attempt3).toBe(3);
    });

    it("should track different signatures separately", () => {
      const attempt1 = manager.trackValidationFailure("write_file:a");
      const attempt2 = manager.trackValidationFailure("write_file:b");

      expect(attempt1).toBe(1);
      expect(attempt2).toBe(1);
    });
  });
});
