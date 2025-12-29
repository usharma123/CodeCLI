/* @jsxImportSource solid-js */
/**
 * Agent Context Provider
 *
 * Provides access to the AIAgent instance throughout the app.
 */

import { createContext, useContext, type JSXElement } from "solid-js";
import type { AIAgent } from "../../core/agent.js";

interface AgentContextValue {
  agent: AIAgent;
  processInput: (input: string) => Promise<void>;
  getModel: () => string;
  setModel: (model: string) => void;
  getTodos: () => { todos: any[] };
  getPlanState: () => { status: string; plan: any };
}

const AgentContext = createContext<AgentContextValue>();

export function AgentProvider(props: { agent: AIAgent; children: JSXElement }) {
  const { agent } = props;

  const processInput = async (input: string) => {
    if (!input.trim()) return;
    await agent.processUserInput(input);
  };

  const getModel = () => agent.getModel();

  const setModel = (model: string) => {
    // Agent method to set model if available
    if (typeof (agent as any).setModel === "function") {
      (agent as any).setModel(model);
    }
  };

  const getTodos = () => agent.getTodos();

  const getPlanState = () => agent.getPlanState();

  return (
    <AgentContext.Provider
      value={{
        agent,
        processInput,
        getModel,
        setModel,
        getTodos,
        getPlanState,
      }}
    >
      {props.children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error("useAgent must be used within AgentProvider");
  }
  return context;
}
