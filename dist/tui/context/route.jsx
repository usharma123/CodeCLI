/* @jsxImportSource solid-js */
/**
 * Route Context Provider
 *
 * Simple routing for the TUI (home vs session view).
 */
import { createContext, useContext, createSignal } from "solid-js";
const RouteContext = createContext();
export function RouteProvider(props) {
    // Start directly in session view (matching current behavior)
    const [current, setCurrent] = createSignal("session");
    const [params, setParams] = createSignal({});
    const navigate = (route) => {
        setCurrent(route);
    };
    return (<RouteContext.Provider value={{ current, navigate, params, setParams }}>
      {props.children}
    </RouteContext.Provider>);
}
export function useRoute() {
    const context = useContext(RouteContext);
    if (!context) {
        throw new Error("useRoute must be used within RouteProvider");
    }
    return context;
}
