/* @jsxImportSource solid-js */
/**
 * Theme Context Provider
 *
 * Manages theme state and provides colors/styling.
 */
import { createContext, useContext, createSignal } from "solid-js";
// Default dark theme (similar to current theme.ts)
const darkTheme = {
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
const lightTheme = {
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
const ThemeContext = createContext();
export function ThemeProvider(props) {
    const [isDark, setIsDark] = createSignal(props.isDarkMode);
    const [theme, setThemeState] = createSignal(props.isDarkMode ? darkTheme : lightTheme);
    const toggleTheme = () => {
        const newIsDark = !isDark();
        setIsDark(newIsDark);
        setThemeState(newIsDark ? darkTheme : lightTheme);
    };
    const setTheme = (name) => {
        // For now, just toggle between dark and light
        // Can be extended to support more themes
        if (name.includes("light")) {
            setIsDark(false);
            setThemeState(lightTheme);
        }
        else {
            setIsDark(true);
            setThemeState(darkTheme);
        }
    };
    return (<ThemeContext.Provider value={{ theme, isDarkMode: isDark, toggleTheme, setTheme }}>
      {props.children}
    </ThemeContext.Provider>);
}
export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within ThemeProvider");
    }
    return context;
}
