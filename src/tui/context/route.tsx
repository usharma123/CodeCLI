/* @jsxImportSource @opentui/solid */
/**
 * Route Context Provider
 *
 * Simple routing for the TUI (home vs session view).
 */

import { createContext, useContext, createSignal, type JSXElement } from "solid-js";

type Route = "home" | "session";

interface RouteContextValue {
  current: () => Route;
  navigate: (route: Route) => void;
  params: () => Record<string, string>;
  setParams: (params: Record<string, string>) => void;
}

const RouteContext = createContext<RouteContextValue>();

export function RouteProvider(props: { children: JSXElement }) {
  // Start directly in session view (matching current behavior)
  const [current, setCurrent] = createSignal<Route>("session");
  const [params, setParams] = createSignal<Record<string, string>>({});

  const navigate = (route: Route) => {
    setCurrent(route);
  };

  return (
    <RouteContext.Provider value={{ current, navigate, params, setParams }}>
      {props.children}
    </RouteContext.Provider>
  );
}

export function useRoute() {
  const context = useContext(RouteContext);
  if (!context) {
    throw new Error("useRoute must be used within RouteProvider");
  }
  return context;
}
