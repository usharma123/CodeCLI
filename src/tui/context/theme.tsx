/* @jsxImportSource @opentui/solid */
/**
 * Theme Context Provider
 *
 * Manages theme state and provides colors/styling.
 */

import { createContext, useContext, createSignal, type JSXElement } from "solid-js";

export interface Theme {
  name: string;
  mode: "dark" | "light";
  colors: {
    primary: string;
    accent: string;
    background: string;
    foreground: string;
    muted: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  icons: {
    success: string;
    error: string;
    warning: string;
    info: string;
    pending: string;
    active: string;
    completed: string;
    arrow: string;
    bullet: string;
    pipe: string;
    command: string;
    file: string;
    shell: string;
  };
}

// Default dark theme (similar to current theme.ts)
const darkTheme: Theme = {
  name: "default-dark",
  mode: "dark",
  colors: {
    primary: "#5FAFFF",
    accent: "#87AFFF",
    background: "#1a1a1a",
    foreground: "#ffffff",
    muted: "#808080",
    border: "#404040",
    success: "#00FF00",
    warning: "#FFFF00",
    error: "#FF0000",
    info: "#00FFFF",
  },
  icons: {
    success: "\u2713",
    error: "\u2717",
    warning: "!",
    info: "i",
    pending: "\u25CB",
    active: "\u25CF",
    completed: "\u25CF",
    arrow: "\u2192",
    bullet: "\u00B7",
    pipe: "\u2502",
    command: "/",
    file: "@",
    shell: "$",
  },
};

const lightTheme: Theme = {
  ...darkTheme,
  name: "default-light",
  mode: "light",
  colors: {
    ...darkTheme.colors,
    background: "#ffffff",
    foreground: "#1a1a1a",
    muted: "#606060",
    border: "#d0d0d0",
  },
};

interface ThemeContextValue {
  theme: () => Theme;
  isDarkMode: () => boolean;
  toggleTheme: () => void;
  setTheme: (name: string) => void;
}

const ThemeContext = createContext<ThemeContextValue>();

export function ThemeProvider(props: { isDarkMode: boolean; children: JSXElement }) {
  const [isDark, setIsDark] = createSignal(props.isDarkMode);
  const [theme, setThemeState] = createSignal<Theme>(props.isDarkMode ? darkTheme : lightTheme);

  const toggleTheme = () => {
    const newIsDark = !isDark();
    setIsDark(newIsDark);
    setThemeState(newIsDark ? darkTheme : lightTheme);
  };

  const setTheme = (name: string) => {
    // For now, just toggle between dark and light
    // Can be extended to support more themes
    if (name.includes("light")) {
      setIsDark(false);
      setThemeState(lightTheme);
    } else {
      setIsDark(true);
      setThemeState(darkTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode: isDark, toggleTheme, setTheme }}>
      {props.children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
