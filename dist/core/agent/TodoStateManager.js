/**
 * TodoStateManager - Manages todo list state
 *
 * Single Responsibility: CRUD operations for todo list state
 */
import { emitStatus } from "../status.js";
export class TodoStateManager {
    state;
    constructor() {
        this.state = {
            todos: [],
            lastUpdated: 0
        };
    }
    /**
     * Get the complete todo state
     */
    getState() {
        return this.state;
    }
    /**
     * Get the list of todos
     */
    getTodos() {
        return this.state.todos;
    }
    /**
     * Get the currently in-progress todo, if any
     */
    getInProgressTodo() {
        return this.state.todos.find(t => t.status === "in_progress") || null;
    }
    /**
     * Update the entire todo list
     */
    updateTodos(todos) {
        this.state = {
            todos: todos.map((t, i) => ({
                ...t,
                id: t.id || `todo_${Date.now()}_${i}`,
                createdAt: t.createdAt || Date.now()
            })),
            lastUpdated: Date.now()
        };
        // Emit status update for in-progress todo
        const inProgress = this.getInProgressTodo();
        if (inProgress) {
            emitStatus({
                phase: "running_tools",
                message: inProgress.activeForm
            });
        }
    }
    /**
     * Mark a specific todo as completed by ID
     */
    markComplete(todoId) {
        const todo = this.state.todos.find(t => t.id === todoId);
        if (todo) {
            todo.status = "completed";
            this.state.lastUpdated = Date.now();
        }
    }
    /**
     * Mark a specific todo as in-progress by ID
     */
    markInProgress(todoId) {
        // First, ensure no other todo is in_progress
        for (const todo of this.state.todos) {
            if (todo.status === "in_progress") {
                todo.status = "pending";
            }
        }
        const todo = this.state.todos.find(t => t.id === todoId);
        if (todo) {
            todo.status = "in_progress";
            this.state.lastUpdated = Date.now();
            // Emit status for the newly active todo
            emitStatus({
                phase: "running_tools",
                message: todo.activeForm
            });
        }
    }
    /**
     * Clear all todos
     */
    clear() {
        this.state = {
            todos: [],
            lastUpdated: Date.now()
        };
    }
}
