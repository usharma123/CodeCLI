/* @jsxImportSource solid-js */
/**
 * Sync Context Provider
 *
 * Bridges existing EventEmitter patterns to SolidJS signals.
 * This is the critical adapter between the existing agent system and the new TUI.
 */
import { createContext, useContext, createEffect, onCleanup, } from "solid-js";
import { createStore, produce } from "solid-js/store";
import { onStatus, getStatus } from "../../core/status.js";
import { onToolOutput, getRecentOutputs } from "../../core/output.js";
import { useAgent } from "./agent.js";
const SyncContext = createContext();
export function SyncProvider(props) {
    const { agent, getTodos, getPlanState } = useAgent();
    const [state, setState] = createStore({
        status: {
            phase: "idle",
            message: getStatus().message || "",
        },
        todos: [],
        outputs: getRecentOutputs(),
        plan: {
            status: "none",
            plan: null,
        },
        isProcessing: false,
        processingStartTime: null,
    });
    // Subscribe to status updates
    createEffect(() => {
        const unsubscribe = onStatus((s) => {
            setState("status", {
                phase: s.message ? "processing" : "idle",
                message: s.message,
            });
            setState("isProcessing", !!s.message);
            if (s.message && !state.processingStartTime) {
                setState("processingStartTime", Date.now());
            }
            else if (!s.message) {
                setState("processingStartTime", null);
            }
        });
        onCleanup(unsubscribe);
    });
    // Subscribe to tool outputs
    createEffect(() => {
        const unsubscribe = onToolOutput((output) => {
            setState("outputs", produce((outputs) => {
                // Add new output, keeping max 100 items
                outputs.push(output);
                if (outputs.length > 100) {
                    outputs.shift();
                }
            }));
        });
        onCleanup(unsubscribe);
    });
    // Poll for todos and plan state (matching existing behavior)
    createEffect(() => {
        const interval = setInterval(() => {
            try {
                // Update todos
                const todoState = getTodos();
                setState("todos", todoState.todos || []);
                // Update plan state
                const planState = getPlanState();
                if (planState.status === "pending_approval" && planState.plan) {
                    setState("plan", {
                        status: "pending_approval",
                        plan: planState.plan,
                    });
                    setState("isProcessing", false);
                }
                else {
                    setState("plan", {
                        status: planState.status === "approved" ? "approved" : "none",
                        plan: null,
                    });
                }
            }
            catch {
                // Silently ignore polling errors
            }
        }, 500);
        onCleanup(() => clearInterval(interval));
    });
    const clearOutputs = () => {
        setState("outputs", []);
    };
    const getOutputById = (id) => {
        return state.outputs.find((o) => o.id === id);
    };
    return (<SyncContext.Provider value={{ state, clearOutputs, getOutputById }}>
      {props.children}
    </SyncContext.Provider>);
}
export function useSync() {
    const context = useContext(SyncContext);
    if (!context) {
        throw new Error("useSync must be used within SyncProvider");
    }
    return context;
}
