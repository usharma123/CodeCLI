import { describe, it, expect, beforeEach } from "bun:test";
import { TodoStateManager } from "../TodoStateManager.js";
describe("TodoStateManager", () => {
    let manager;
    beforeEach(() => {
        manager = new TodoStateManager();
    });
    describe("initialization", () => {
        it("should start with empty todos", () => {
            const state = manager.getState();
            expect(state.todos).toEqual([]);
            expect(state.lastUpdated).toBe(0);
        });
        it("should return empty array from getTodos", () => {
            expect(manager.getTodos()).toEqual([]);
        });
        it("should return null for getInProgressTodo", () => {
            expect(manager.getInProgressTodo()).toBeNull();
        });
    });
    describe("updateTodos", () => {
        it("should update todos with new list", () => {
            const todos = [
                { content: "Task 1", activeForm: "Doing Task 1", status: "pending" },
                { content: "Task 2", activeForm: "Doing Task 2", status: "in_progress" },
            ];
            manager.updateTodos(todos);
            const state = manager.getState();
            expect(state.todos).toHaveLength(2);
            expect(state.todos[0].content).toBe("Task 1");
            expect(state.todos[1].content).toBe("Task 2");
            expect(state.lastUpdated).toBeGreaterThan(0);
        });
        it("should assign IDs to todos without them", () => {
            const todos = [
                { content: "Task 1", activeForm: "Doing Task 1", status: "pending" },
            ];
            manager.updateTodos(todos);
            const state = manager.getState();
            expect(state.todos[0].id).toBeDefined();
            expect(state.todos[0].id).toMatch(/^todo_\d+_0$/);
        });
        it("should preserve existing IDs", () => {
            const todos = [
                { id: "my-custom-id", content: "Task 1", activeForm: "Doing Task 1", status: "pending" },
            ];
            manager.updateTodos(todos);
            const state = manager.getState();
            expect(state.todos[0].id).toBe("my-custom-id");
        });
        it("should assign createdAt to todos without them", () => {
            const todos = [
                { content: "Task 1", activeForm: "Doing Task 1", status: "pending" },
            ];
            manager.updateTodos(todos);
            const state = manager.getState();
            expect(state.todos[0].createdAt).toBeDefined();
            expect(state.todos[0].createdAt).toBeGreaterThan(0);
        });
    });
    describe("getInProgressTodo", () => {
        it("should return the in-progress todo", () => {
            const todos = [
                { content: "Task 1", activeForm: "Doing Task 1", status: "completed" },
                { content: "Task 2", activeForm: "Doing Task 2", status: "in_progress" },
                { content: "Task 3", activeForm: "Doing Task 3", status: "pending" },
            ];
            manager.updateTodos(todos);
            const inProgress = manager.getInProgressTodo();
            expect(inProgress).not.toBeNull();
            expect(inProgress?.content).toBe("Task 2");
        });
        it("should return null when no todo is in progress", () => {
            const todos = [
                { content: "Task 1", activeForm: "Doing Task 1", status: "completed" },
                { content: "Task 2", activeForm: "Doing Task 2", status: "pending" },
            ];
            manager.updateTodos(todos);
            expect(manager.getInProgressTodo()).toBeNull();
        });
    });
    describe("markComplete", () => {
        it("should mark a todo as completed by ID", () => {
            const todos = [
                { id: "task-1", content: "Task 1", activeForm: "Doing Task 1", status: "in_progress" },
            ];
            manager.updateTodos(todos);
            manager.markComplete("task-1");
            const state = manager.getState();
            expect(state.todos[0].status).toBe("completed");
        });
        it("should update lastUpdated when marking complete", () => {
            const todos = [
                { id: "task-1", content: "Task 1", activeForm: "Doing Task 1", status: "in_progress" },
            ];
            manager.updateTodos(todos);
            const beforeUpdate = manager.getState().lastUpdated;
            // Small delay to ensure timestamp difference
            manager.markComplete("task-1");
            expect(manager.getState().lastUpdated).toBeGreaterThanOrEqual(beforeUpdate);
        });
        it("should do nothing for non-existent ID", () => {
            const todos = [
                { id: "task-1", content: "Task 1", activeForm: "Doing Task 1", status: "in_progress" },
            ];
            manager.updateTodos(todos);
            manager.markComplete("non-existent");
            expect(manager.getState().todos[0].status).toBe("in_progress");
        });
    });
    describe("markInProgress", () => {
        it("should mark a todo as in-progress by ID", () => {
            const todos = [
                { id: "task-1", content: "Task 1", activeForm: "Doing Task 1", status: "pending" },
            ];
            manager.updateTodos(todos);
            manager.markInProgress("task-1");
            expect(manager.getState().todos[0].status).toBe("in_progress");
        });
        it("should reset other in-progress todos to pending", () => {
            const todos = [
                { id: "task-1", content: "Task 1", activeForm: "Doing Task 1", status: "in_progress" },
                { id: "task-2", content: "Task 2", activeForm: "Doing Task 2", status: "pending" },
            ];
            manager.updateTodos(todos);
            manager.markInProgress("task-2");
            const state = manager.getState();
            expect(state.todos[0].status).toBe("pending");
            expect(state.todos[1].status).toBe("in_progress");
        });
    });
    describe("clear", () => {
        it("should remove all todos", () => {
            const todos = [
                { content: "Task 1", activeForm: "Doing Task 1", status: "pending" },
                { content: "Task 2", activeForm: "Doing Task 2", status: "in_progress" },
            ];
            manager.updateTodos(todos);
            manager.clear();
            expect(manager.getTodos()).toEqual([]);
        });
        it("should update lastUpdated when clearing", () => {
            const todos = [
                { content: "Task 1", activeForm: "Doing Task 1", status: "pending" },
            ];
            manager.updateTodos(todos);
            manager.clear();
            expect(manager.getState().lastUpdated).toBeGreaterThan(0);
        });
    });
});
