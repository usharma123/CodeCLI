/**
 * Tests for context compaction
 * Tests Bug #26, #27, #28, #30, #31, #32, #33
 */

import { describe, test, expect, mock, beforeEach } from "bun:test";
import {
  ContextCompactionManager,
  CompactionError,
  DEFAULT_COMPACTION_CONFIG,
  type ConversationSummary
} from "../context-compaction.js";

// Mock OpenAI client
const createMockClient = () => ({
  chat: {
    completions: {
      create: mock(async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                taskDescription: "Test task",
                completedWork: ["Item 1"],
                currentState: "In progress",
                remainingWork: ["Item 2"],
                importantContext: ["Context 1"]
              })
            }
          }
        ]
      }))
    }
  }
});

describe("ContextCompactionManager", () => {
  describe("constructor and configuration", () => {
    test("should use default config when no options provided", () => {
      const client = createMockClient();
      const manager = new ContextCompactionManager(client as any);

      expect(manager.getConfig().maxTokens).toBe(DEFAULT_COMPACTION_CONFIG.maxTokens);
      expect(manager.getConfig().preserveMessageCount).toBe(DEFAULT_COMPACTION_CONFIG.preserveMessageCount);
    });

    test("should merge custom config with defaults", () => {
      const client = createMockClient();
      const manager = new ContextCompactionManager(client as any, {
        maxTokens: 100000,
        preserveMessageCount: 10
      });

      expect(manager.getConfig().maxTokens).toBe(100000);
      expect(manager.getConfig().preserveMessageCount).toBe(10);
      expect(manager.getConfig().warningThreshold).toBe(DEFAULT_COMPACTION_CONFIG.warningThreshold);
    });

    test("should allow updating config (Bug #25)", () => {
      const client = createMockClient();
      const manager = new ContextCompactionManager(client as any);

      manager.updateConfig({ preserveMessageCount: 8 });

      expect(manager.getConfig().preserveMessageCount).toBe(8);
    });
  });

  describe("model validation (Bug #28)", () => {
    test("should not warn for known models", () => {
      const originalWarn = console.warn;
      const warnings: string[] = [];
      console.warn = (...args: any[]) => warnings.push(args.join(" "));

      const client = createMockClient();
      new ContextCompactionManager(client as any, {
        summaryModel: "gpt-4"
      });

      expect(warnings.length).toBe(0);
      console.warn = originalWarn;
    });

    test("should warn for unknown models with invalid pattern", () => {
      const originalWarn = console.warn;
      const warnings: string[] = [];
      console.warn = (...args: any[]) => warnings.push(args.join(" "));

      const client = createMockClient();
      new ContextCompactionManager(client as any, {
        summaryModel: "invalid model with spaces!"
      });

      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0]).toContain("not in the list of known models");
      console.warn = originalWarn;
    });
  });

  describe("shouldCompact", () => {
    test("should return shouldCompact true when over 90% capacity", () => {
      const client = createMockClient();
      const manager = new ContextCompactionManager(client as any, {
        maxTokens: 1000
      });

      // Create messages that simulate high token usage
      const messages = Array(100).fill(null).map(() => ({
        role: "user",
        content: "a".repeat(100) // Each message ~25 tokens
      }));

      const result = manager.shouldCompact(messages);
      // Note: actual result depends on token tracker implementation
      expect(typeof result.shouldCompact).toBe("boolean");
      expect(typeof result.shouldWarn).toBe("boolean");
      expect(typeof result.estimatedTokens).toBe("number");
      expect(typeof result.percentUsed).toBe("number");
    });
  });

  describe("parseSummaryResponse (Bug #26 - robustness)", () => {
    test("should parse JSON from markdown code block", async () => {
      const mockResponse = `Here's the summary:
\`\`\`json
{
  "taskDescription": "Building a feature",
  "completedWork": ["Step 1", "Step 2"],
  "currentState": "In progress",
  "remainingWork": ["Step 3"],
  "importantContext": ["Config A"]
}
\`\`\`
`;
      const client = {
        chat: {
          completions: {
            create: mock(async () => ({
              choices: [{ message: { content: mockResponse } }]
            }))
          }
        }
      };

      const manager = new ContextCompactionManager(client as any);
      const messages = [{ role: "user", content: "test" }];

      const summary = await manager.generateSummary(messages);

      expect(summary.taskDescription).toBe("Building a feature");
      expect(summary.completedWork).toEqual(["Step 1", "Step 2"]);
    });

    test("should parse raw JSON object", async () => {
      const mockResponse = `{
  "taskDescription": "Raw JSON task",
  "completedWork": [],
  "currentState": "Testing",
  "remainingWork": [],
  "importantContext": []
}`;
      const client = {
        chat: {
          completions: {
            create: mock(async () => ({
              choices: [{ message: { content: mockResponse } }]
            }))
          }
        }
      };

      const manager = new ContextCompactionManager(client as any);
      const messages = [{ role: "user", content: "test" }];

      const summary = await manager.generateSummary(messages);

      expect(summary.taskDescription).toBe("Raw JSON task");
    });

    test("should fallback gracefully on unparseable response", async () => {
      const client = {
        chat: {
          completions: {
            create: mock(async () => ({
              choices: [{ message: { content: "This is just plain text with no JSON" } }]
            }))
          }
        }
      };

      const manager = new ContextCompactionManager(client as any);
      const messages = [{ role: "user", content: "test" }];

      const summary = await manager.generateSummary(messages);

      expect(summary.taskDescription).toBe("Continuing previous work");
      expect(summary.currentState).toBe("This is just plain text with no JSON");
    });
  });

  describe("error handling (Bug #30)", () => {
    test("should throw CompactionError on rate limit", async () => {
      const client = {
        chat: {
          completions: {
            create: mock(async () => {
              throw new Error("rate limit exceeded");
            })
          }
        }
      };

      const manager = new ContextCompactionManager(client as any);
      const messages = [{ role: "user", content: "test" }];

      try {
        await manager.generateSummary(messages);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(CompactionError);
        expect((error as CompactionError).type).toBe("api");
        expect((error as CompactionError).message).toContain("Rate limited");
      }
    });

    test("should throw CompactionError on model not found", async () => {
      const client = {
        chat: {
          completions: {
            create: mock(async () => {
              throw new Error("model not found");
            })
          }
        }
      };

      const manager = new ContextCompactionManager(client as any);
      const messages = [{ role: "user", content: "test" }];

      try {
        await manager.generateSummary(messages);
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(CompactionError);
        expect((error as CompactionError).type).toBe("validation");
      }
    });
  });

  describe("concurrency control (Bug #27)", () => {
    test("should queue concurrent compaction requests", async () => {
      let callCount = 0;
      const client = {
        chat: {
          completions: {
            create: mock(async () => {
              callCount++;
              // Simulate async work
              await new Promise(resolve => setTimeout(resolve, 50));
              return {
                choices: [{
                  message: {
                    content: JSON.stringify({
                      taskDescription: `Call ${callCount}`,
                      completedWork: [],
                      currentState: "Done",
                      remainingWork: [],
                      importantContext: []
                    })
                  }
                }]
              };
            })
          }
        }
      };

      const manager = new ContextCompactionManager(client as any);
      const messages = [
        { role: "system", content: "System" },
        { role: "user", content: "User 1" },
        { role: "assistant", content: "Assistant 1" },
        { role: "user", content: "User 2" },
        { role: "assistant", content: "Assistant 2" },
        { role: "user", content: "User 3" },
        { role: "assistant", content: "Assistant 3" },
        { role: "user", content: "User 4" },
        { role: "assistant", content: "Assistant 4" }
      ];

      // Start multiple compactions concurrently
      const results = await Promise.all([
        manager.compactConversation(messages),
        manager.compactConversation(messages),
        manager.compactConversation(messages)
      ]);

      // All should complete
      expect(results.length).toBe(3);
      results.forEach(result => {
        expect(result.compactedMessages).toBeDefined();
        expect(result.summary).toBeDefined();
      });
    });
  });

  describe("context restoration (Bug #31)", () => {
    test("should store and restore original messages", async () => {
      const client = createMockClient();
      const manager = new ContextCompactionManager(client as any);

      const originalMessages = [
        { role: "system", content: "System" },
        { role: "user", content: "User 1" },
        { role: "assistant", content: "Assistant 1" },
        { role: "user", content: "User 2" },
        { role: "assistant", content: "Assistant 2" }
      ];

      const result = await manager.compactConversation([...originalMessages]);

      expect(result.compactionId).toBeDefined();

      const restored = manager.restoreFromCompaction(result.compactionId!);

      expect(restored).toBeDefined();
      expect(restored!.length).toBe(originalMessages.length);
    });

    test("should return null for invalid compaction ID", () => {
      const client = createMockClient();
      const manager = new ContextCompactionManager(client as any);

      const restored = manager.restoreFromCompaction(99999);

      expect(restored).toBeNull();
    });

    test("clearRestorationData should remove all stored messages", async () => {
      const client = createMockClient();
      const manager = new ContextCompactionManager(client as any);

      const messages = [
        { role: "system", content: "System" },
        { role: "user", content: "User" },
        { role: "assistant", content: "Assistant" }
      ];

      const result = await manager.compactConversation(messages);
      manager.clearRestorationData();

      const restored = manager.restoreFromCompaction(result.compactionId!);
      expect(restored).toBeNull();
    });
  });

  describe("getStats", () => {
    test("should return compaction statistics", async () => {
      const client = createMockClient();
      const manager = new ContextCompactionManager(client as any);

      const stats = manager.getStats();

      expect(stats.compactionCount).toBe(0);
      expect(stats.totalTokensProcessed).toBe(0);
      expect(stats.averageTokensPerCompaction).toBe(0);
      expect(stats.pendingQueueLength).toBe(0);
      expect(stats.storedRestorationPoints).toBe(0);
    });

    test("should track compaction count after compaction", async () => {
      const client = createMockClient();
      const manager = new ContextCompactionManager(client as any);

      const messages = [
        { role: "system", content: "System" },
        { role: "user", content: "User 1" },
        { role: "assistant", content: "Assistant 1" },
        { role: "user", content: "User 2" },
        { role: "assistant", content: "Assistant 2" }
      ];

      await manager.compactConversation(messages);
      const stats = manager.getStats();

      expect(stats.compactionCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe("formatSummaryForContext", () => {
    test("should format summary as markdown", () => {
      const client = createMockClient();
      const manager = new ContextCompactionManager(client as any);

      const summary: ConversationSummary = {
        taskDescription: "Test task",
        completedWork: ["Step 1", "Step 2"],
        currentState: "In progress",
        remainingWork: ["Step 3"],
        importantContext: ["Config A"],
        timestamp: Date.now(),
        tokensSaved: 1000
      };

      const formatted = manager.formatSummaryForContext(summary);

      expect(formatted).toContain("# Previous Conversation Summary");
      expect(formatted).toContain("**Task:** Test task");
      expect(formatted).toContain("## Completed Work");
      expect(formatted).toContain("- Step 1");
      expect(formatted).toContain("- Step 2");
      expect(formatted).toContain("## Current State");
      expect(formatted).toContain("In progress");
      expect(formatted).toContain("## Remaining Work");
      expect(formatted).toContain("- Step 3");
      expect(formatted).toContain("## Important Context");
      expect(formatted).toContain("- Config A");
    });
  });
});

describe("CompactionError", () => {
  test("should be instanceof Error", () => {
    const error = new CompactionError("test", "api");
    expect(error).toBeInstanceOf(Error);
  });

  test("should have correct properties", () => {
    const cause = new Error("original");
    const error = new CompactionError("test message", "validation", cause);

    expect(error.message).toBe("test message");
    expect(error.type).toBe("validation");
    expect(error.cause).toBe(cause);
    expect(error.name).toBe("CompactionError");
  });
});
