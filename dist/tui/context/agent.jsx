/* @jsxImportSource solid-js */
/**
 * Agent Context Provider
 *
 * Provides access to the AIAgent instance throughout the app.
 */
import { createContext, useContext } from "solid-js";
const AgentContext = createContext();
export function AgentProvider(props) {
    const { agent } = props;
    const processInput = async (input) => {
        if (!input.trim())
            return;
        await agent.processUserInput(input);
    };
    const getModel = () => agent.getModel();
    const setModel = (model) => {
        // Agent method to set model if available
        if (typeof agent.setModel === "function") {
            agent.setModel(model);
        }
    };
    const getTodos = () => agent.getTodos();
    const getPlanState = () => agent.getPlanState();
    return (<AgentContext.Provider value={{
            agent,
            processInput,
            getModel,
            setModel,
            getTodos,
            getPlanState,
        }}>
      {props.children}
    </AgentContext.Provider>);
}
export function useAgent() {
    const context = useContext(AgentContext);
    if (!context) {
        throw new Error("useAgent must be used within AgentProvider");
    }
    return context;
}
