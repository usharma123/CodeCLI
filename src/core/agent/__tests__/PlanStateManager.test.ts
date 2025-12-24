import { describe, it, expect, beforeEach } from "bun:test";
import { PlanStateManager } from "../PlanStateManager.js";
import type { Plan } from "../types.js";

describe("PlanStateManager", () => {
  let manager: PlanStateManager;

  const samplePlan: Plan = {
    title: "Test Plan",
    summary: "A test implementation plan",
    sections: [
      {
        title: "Phase 1",
        description: "Initial setup",
        tasks: ["Create database schema", "Add authentication"],
      },
      {
        title: "Phase 2",
        description: "Implementation",
        tasks: ["Implement user API", "Write tests"],
      },
    ],
  };

  beforeEach(() => {
    manager = new PlanStateManager();
  });

  describe("initialization", () => {
    it("should start with idle status", () => {
      const state = manager.getState();
      expect(state.status).toBe("idle");
      expect(state.plan).toBeNull();
    });

    it("should return null for getPlan", () => {
      expect(manager.getPlan()).toBeNull();
    });

    it("should return idle for getStatus", () => {
      expect(manager.getStatus()).toBe("idle");
    });
  });

  describe("updatePlan", () => {
    it("should set the plan and status to pending_approval", () => {
      manager.updatePlan(samplePlan);

      const state = manager.getState();
      expect(state.plan).toEqual(samplePlan);
      expect(state.status).toBe("pending_approval");
      expect(state.lastUpdated).toBeGreaterThan(0);
    });

    it("should update getPlan to return the plan", () => {
      manager.updatePlan(samplePlan);
      expect(manager.getPlan()).toEqual(samplePlan);
    });
  });

  describe("approve", () => {
    it("should convert plan sections to todos", () => {
      manager.updatePlan(samplePlan);
      const todos = manager.approve();

      expect(todos).toHaveLength(4);
      expect(todos[0].content).toBe("Create database schema");
      expect(todos[1].content).toBe("Add authentication");
      expect(todos[2].content).toBe("Implement user API");
      expect(todos[3].content).toBe("Write tests");
    });

    it("should set first todo to in_progress", () => {
      manager.updatePlan(samplePlan);
      const todos = manager.approve();

      expect(todos[0].status).toBe("in_progress");
      expect(todos[1].status).toBe("pending");
      expect(todos[2].status).toBe("pending");
      expect(todos[3].status).toBe("pending");
    });

    it("should convert task verbs to active form", () => {
      const planWithVerbs: Plan = {
        title: "Test",
        summary: "Test",
        sections: [
          {
            title: "Tasks",
            description: "Tasks",
            tasks: [
              "Add user model",
              "Create login form",
              "Implement auth flow",
              "Update settings page",
              "Fix validation bug",
              "Remove deprecated code",
              "Write unit tests",
              "Build production bundle",
              "Set up CI/CD",
            ],
          },
        ],
      };

      manager.updatePlan(planWithVerbs);
      const todos = manager.approve();

      expect(todos[0].activeForm).toBe("Adding user model");
      expect(todos[1].activeForm).toBe("Creating login form");
      expect(todos[2].activeForm).toBe("Implementing auth flow");
      expect(todos[3].activeForm).toBe("Updating settings page");
      expect(todos[4].activeForm).toBe("Fixing validation bug");
      expect(todos[5].activeForm).toBe("Removing deprecated code");
      expect(todos[6].activeForm).toBe("Writing unit tests");
      expect(todos[7].activeForm).toBe("Building production bundle");
      expect(todos[8].activeForm).toBe("Setting up CI/CD");
    });

    it("should set status to approved", () => {
      manager.updatePlan(samplePlan);
      manager.approve();

      expect(manager.getStatus()).toBe("approved");
    });

    it("should return empty array if no plan", () => {
      const todos = manager.approve();
      expect(todos).toEqual([]);
    });
  });

  describe("reject", () => {
    it("should clear the plan and set status to rejected", () => {
      manager.updatePlan(samplePlan);
      manager.reject();

      expect(manager.getPlan()).toBeNull();
      expect(manager.getStatus()).toBe("rejected");
    });

    it("should update lastUpdated", () => {
      manager.updatePlan(samplePlan);
      const beforeReject = manager.getState().lastUpdated;
      manager.reject();

      expect(manager.getState().lastUpdated).toBeGreaterThanOrEqual(beforeReject);
    });
  });

  describe("requestModification", () => {
    it("should set status to modifying", () => {
      manager.updatePlan(samplePlan);
      manager.requestModification("Add more tests");

      expect(manager.getStatus()).toBe("modifying");
    });

    it("should store modification request", () => {
      manager.updatePlan(samplePlan);
      manager.requestModification("Add more tests");

      expect(manager.getState().modificationRequest).toBe("Add more tests");
    });

    it("should clear the plan to allow new one", () => {
      manager.updatePlan(samplePlan);
      manager.requestModification("Add more tests");

      expect(manager.getPlan()).toBeNull();
    });
  });

  describe("clearPlan", () => {
    it("should clear plan and reset to idle", () => {
      manager.updatePlan(samplePlan);
      manager.clearPlan();

      expect(manager.getPlan()).toBeNull();
      expect(manager.getStatus()).toBe("idle");
    });
  });
});
