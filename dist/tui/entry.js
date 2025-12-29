var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/tui/entry.ts
import { render } from "@opentui/solid";

// src/tui/app.tsx
import { createComponent as _$createComponent24 } from "solid-js/web";
import { Show as Show11 } from "solid-js";

// src/tui/context/exit.tsx
import { createComponent as _$createComponent } from "solid-js/web";
import { createContext, useContext, createSignal } from "solid-js";
var ExitContext = createContext();
function ExitProvider(props) {
  const [isExiting, setIsExiting] = createSignal(false);
  const exit = /* @__PURE__ */ __name((code = 0) => {
    setIsExiting(true);
    setTimeout(() => {
      process.exit(code);
    }, 100);
  }, "exit");
  return _$createComponent(ExitContext.Provider, {
    value: {
      exit,
      isExiting
    },
    get children() {
      return props.children;
    }
  });
}
__name(ExitProvider, "ExitProvider");
function useExit() {
  const context = useContext(ExitContext);
  if (!context) {
    throw new Error("useExit must be used within ExitProvider");
  }
  return context;
}
__name(useExit, "useExit");

// src/tui/context/theme.tsx
import { createComponent as _$createComponent2 } from "solid-js/web";
import { createContext as createContext2, useContext as useContext2, createSignal as createSignal2 } from "solid-js";
var darkTheme = {
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
    info: "#00FFFF"
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
    bullet: "\xB7",
    pipe: "\u2502",
    command: "/",
    file: "@",
    shell: "$"
  }
};
var lightTheme = {
  ...darkTheme,
  name: "default-light",
  mode: "light",
  colors: {
    ...darkTheme.colors,
    background: "#ffffff",
    foreground: "#1a1a1a",
    muted: "#606060",
    border: "#d0d0d0"
  }
};
var ThemeContext = createContext2();
function ThemeProvider(props) {
  const [isDark, setIsDark] = createSignal2(props.isDarkMode);
  const [theme, setThemeState] = createSignal2(props.isDarkMode ? darkTheme : lightTheme);
  const toggleTheme = /* @__PURE__ */ __name(() => {
    const newIsDark = !isDark();
    setIsDark(newIsDark);
    setThemeState(newIsDark ? darkTheme : lightTheme);
  }, "toggleTheme");
  const setTheme = /* @__PURE__ */ __name((name) => {
    if (name.includes("light")) {
      setIsDark(false);
      setThemeState(lightTheme);
    } else {
      setIsDark(true);
      setThemeState(darkTheme);
    }
  }, "setTheme");
  return _$createComponent2(ThemeContext.Provider, {
    value: {
      theme,
      isDarkMode: isDark,
      toggleTheme,
      setTheme
    },
    get children() {
      return props.children;
    }
  });
}
__name(ThemeProvider, "ThemeProvider");
function useTheme() {
  const context = useContext2(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
__name(useTheme, "useTheme");

// src/tui/context/agent.tsx
import { createComponent as _$createComponent3 } from "solid-js/web";
import { createContext as createContext3, useContext as useContext3 } from "solid-js";
var AgentContext = createContext3();
function AgentProvider(props) {
  const {
    agent
  } = props;
  const processInput = /* @__PURE__ */ __name(async (input) => {
    if (!input.trim()) return;
    await agent.processUserInput(input);
  }, "processInput");
  const getModel = /* @__PURE__ */ __name(() => agent.getModel(), "getModel");
  const setModel = /* @__PURE__ */ __name((model) => {
    if (typeof agent.setModel === "function") {
      agent.setModel(model);
    }
  }, "setModel");
  const getTodos = /* @__PURE__ */ __name(() => agent.getTodos(), "getTodos");
  const getPlanState = /* @__PURE__ */ __name(() => agent.getPlanState(), "getPlanState");
  return _$createComponent3(AgentContext.Provider, {
    value: {
      agent,
      processInput,
      getModel,
      setModel,
      getTodos,
      getPlanState
    },
    get children() {
      return props.children;
    }
  });
}
__name(AgentProvider, "AgentProvider");
function useAgent() {
  const context = useContext3(AgentContext);
  if (!context) {
    throw new Error("useAgent must be used within AgentProvider");
  }
  return context;
}
__name(useAgent, "useAgent");

// src/tui/context/sync.tsx
import { createComponent as _$createComponent4 } from "solid-js/web";
import { createContext as createContext4, useContext as useContext4, createEffect, onCleanup } from "solid-js";
import { createStore, produce } from "solid-js/store";
import { onStatus, getStatus } from "../../core/status.js";
import { onToolOutput, getRecentOutputs } from "../../core/output.js";
var SyncContext = createContext4();
function SyncProvider(props) {
  const {
    agent,
    getTodos,
    getPlanState
  } = useAgent();
  const [state, setState] = createStore({
    status: {
      phase: "idle",
      message: getStatus().message || ""
    },
    todos: [],
    outputs: getRecentOutputs(),
    plan: {
      status: "none",
      plan: null
    },
    isProcessing: false,
    processingStartTime: null
  });
  createEffect(() => {
    const unsubscribe = onStatus((s) => {
      setState("status", {
        phase: s.message ? "processing" : "idle",
        message: s.message
      });
      setState("isProcessing", !!s.message);
      if (s.message && !state.processingStartTime) {
        setState("processingStartTime", Date.now());
      } else if (!s.message) {
        setState("processingStartTime", null);
      }
    });
    onCleanup(unsubscribe);
  });
  createEffect(() => {
    const unsubscribe = onToolOutput((output) => {
      setState("outputs", produce((outputs) => {
        outputs.push(output);
        if (outputs.length > 100) {
          outputs.shift();
        }
      }));
    });
    onCleanup(unsubscribe);
  });
  createEffect(() => {
    const interval = setInterval(() => {
      try {
        const todoState = getTodos();
        setState("todos", todoState.todos || []);
        const planState = getPlanState();
        if (planState.status === "pending_approval" && planState.plan) {
          setState("plan", {
            status: "pending_approval",
            plan: planState.plan
          });
          setState("isProcessing", false);
        } else {
          setState("plan", {
            status: planState.status === "approved" ? "approved" : "none",
            plan: null
          });
        }
      } catch {
      }
    }, 500);
    onCleanup(() => clearInterval(interval));
  });
  const clearOutputs = /* @__PURE__ */ __name(() => {
    setState("outputs", []);
  }, "clearOutputs");
  const getOutputById = /* @__PURE__ */ __name((id) => {
    return state.outputs.find((o) => o.id === id);
  }, "getOutputById");
  return _$createComponent4(SyncContext.Provider, {
    value: {
      state,
      clearOutputs,
      getOutputById
    },
    get children() {
      return props.children;
    }
  });
}
__name(SyncProvider, "SyncProvider");
function useSync() {
  const context = useContext4(SyncContext);
  if (!context) {
    throw new Error("useSync must be used within SyncProvider");
  }
  return context;
}
__name(useSync, "useSync");

// src/tui/context/route.tsx
import { createComponent as _$createComponent5 } from "solid-js/web";
import { createContext as createContext5, useContext as useContext5, createSignal as createSignal3 } from "solid-js";
var RouteContext = createContext5();
function RouteProvider(props) {
  const [current, setCurrent] = createSignal3("session");
  const [params, setParams] = createSignal3({});
  const navigate = /* @__PURE__ */ __name((route) => {
    setCurrent(route);
  }, "navigate");
  return _$createComponent5(RouteContext.Provider, {
    value: {
      current,
      navigate,
      params,
      setParams
    },
    get children() {
      return props.children;
    }
  });
}
__name(RouteProvider, "RouteProvider");
function useRoute() {
  const context = useContext5(RouteContext);
  if (!context) {
    throw new Error("useRoute must be used within RouteProvider");
  }
  return context;
}
__name(useRoute, "useRoute");

// src/tui/context/dialog.tsx
import { createComponent as _$createComponent6 } from "solid-js/web";
import { createContext as createContext6, useContext as useContext6, createSignal as createSignal4 } from "solid-js";
var DialogContext = createContext6();
function DialogProvider(props) {
  const [dialogStack, setDialogStack] = createSignal4([]);
  const current = /* @__PURE__ */ __name(() => {
    const stack = dialogStack();
    return stack.length > 0 ? stack[stack.length - 1] : null;
  }, "current");
  const isOpen = /* @__PURE__ */ __name(() => dialogStack().length > 0, "isOpen");
  const open = /* @__PURE__ */ __name((config) => {
    setDialogStack((stack) => [...stack, config]);
  }, "open");
  const close = /* @__PURE__ */ __name(() => {
    setDialogStack((stack) => stack.slice(0, -1));
  }, "close");
  const confirm = /* @__PURE__ */ __name((message) => {
    return new Promise((resolve) => {
      open({
        type: "confirm",
        message,
        onConfirm: /* @__PURE__ */ __name(() => {
          close();
          resolve(true);
        }, "onConfirm"),
        onCancel: /* @__PURE__ */ __name(() => {
          close();
          resolve(false);
        }, "onCancel")
      });
    });
  }, "confirm");
  const alert = /* @__PURE__ */ __name((message) => {
    return new Promise((resolve) => {
      open({
        type: "alert",
        message,
        onConfirm: /* @__PURE__ */ __name(() => {
          close();
          resolve();
        }, "onConfirm")
      });
    });
  }, "alert");
  const prompt = /* @__PURE__ */ __name((message, defaultValue) => {
    return new Promise((resolve) => {
      open({
        type: "prompt",
        message,
        defaultValue,
        onConfirm: /* @__PURE__ */ __name((value) => {
          close();
          resolve(value || null);
        }, "onConfirm"),
        onCancel: /* @__PURE__ */ __name(() => {
          close();
          resolve(null);
        }, "onCancel")
      });
    });
  }, "prompt");
  const select = /* @__PURE__ */ __name((message, options) => {
    return new Promise((resolve) => {
      open({
        type: "select",
        message,
        options,
        onConfirm: /* @__PURE__ */ __name((value) => {
          close();
          resolve(value);
        }, "onConfirm"),
        onCancel: /* @__PURE__ */ __name(() => {
          close();
          resolve(null);
        }, "onCancel")
      });
    });
  }, "select");
  return _$createComponent6(DialogContext.Provider, {
    value: {
      current,
      isOpen,
      open,
      close,
      confirm,
      alert,
      prompt,
      select
    },
    get children() {
      return props.children;
    }
  });
}
__name(DialogProvider, "DialogProvider");
function useDialog() {
  const context = useContext6(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within DialogProvider");
  }
  return context;
}
__name(useDialog, "useDialog");

// src/tui/context/command.tsx
import { createComponent as _$createComponent7 } from "solid-js/web";
import { createContext as createContext7, useContext as useContext7, createSignal as createSignal5 } from "solid-js";
var CommandContext = createContext7();
function CommandProvider(props) {
  const [commands, setCommands] = createSignal5([]);
  const [isOpen, setIsOpen] = createSignal5(false);
  const register = /* @__PURE__ */ __name((command) => {
    setCommands((prev) => {
      const exists = prev.findIndex((c) => c.name === command.name);
      if (exists >= 0) {
        const updated = [...prev];
        updated[exists] = command;
        return updated;
      }
      return [...prev, command];
    });
  }, "register");
  const unregister = /* @__PURE__ */ __name((name) => {
    setCommands((prev) => prev.filter((c) => c.name !== name));
  }, "unregister");
  const execute = /* @__PURE__ */ __name(async (name) => {
    const command = commands().find((c) => c.name === name);
    if (command) {
      await command.action();
    }
  }, "execute");
  const search = /* @__PURE__ */ __name((query) => {
    if (!query) return commands();
    const lowerQuery = query.toLowerCase();
    return commands().filter((c) => c.name.toLowerCase().includes(lowerQuery) || c.label.toLowerCase().includes(lowerQuery) || c.description?.toLowerCase().includes(lowerQuery)).sort((a, b) => {
      const aExact = a.name.toLowerCase() === lowerQuery || a.label.toLowerCase() === lowerQuery;
      const bExact = b.name.toLowerCase() === lowerQuery || b.label.toLowerCase() === lowerQuery;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return 0;
    });
  }, "search");
  const open = /* @__PURE__ */ __name(() => setIsOpen(true), "open");
  const close = /* @__PURE__ */ __name(() => setIsOpen(false), "close");
  return _$createComponent7(CommandContext.Provider, {
    value: {
      commands,
      register,
      unregister,
      execute,
      search,
      isOpen,
      open,
      close
    },
    get children() {
      return props.children;
    }
  });
}
__name(CommandProvider, "CommandProvider");

// src/tui/context/toast.tsx
import { createComponent as _$createComponent8 } from "solid-js/web";
import { createContext as createContext8, useContext as useContext8, createSignal as createSignal6 } from "solid-js";
var ToastContext = createContext8();
var toastId = 0;
function ToastProvider(props) {
  const [toasts, setToasts] = createSignal6([]);
  const show = /* @__PURE__ */ __name((toast) => {
    const id = `toast-${++toastId}`;
    const duration = toast.duration ?? 3e3;
    setToasts((prev) => [...prev, {
      ...toast,
      id
    }]);
    if (duration > 0) {
      setTimeout(() => {
        dismiss(id);
      }, duration);
    }
    return id;
  }, "show");
  const dismiss = /* @__PURE__ */ __name((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, "dismiss");
  const dismissAll = /* @__PURE__ */ __name(() => {
    setToasts([]);
  }, "dismissAll");
  const info = /* @__PURE__ */ __name((message, duration) => show({
    type: "info",
    message,
    duration
  }), "info");
  const success = /* @__PURE__ */ __name((message, duration) => show({
    type: "success",
    message,
    duration
  }), "success");
  const warning = /* @__PURE__ */ __name((message, duration) => show({
    type: "warning",
    message,
    duration
  }), "warning");
  const error = /* @__PURE__ */ __name((message, duration) => show({
    type: "error",
    message,
    duration
  }), "error");
  return _$createComponent8(ToastContext.Provider, {
    value: {
      toasts,
      show,
      dismiss,
      dismissAll,
      info,
      success,
      warning,
      error
    },
    get children() {
      return props.children;
    }
  });
}
__name(ToastProvider, "ToastProvider");
function useToast() {
  const context = useContext8(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
__name(useToast, "useToast");

// src/tui/context/prompt.tsx
import { createComponent as _$createComponent9 } from "solid-js/web";
import { createContext as createContext9, useContext as useContext9, createSignal as createSignal7 } from "solid-js";
var PromptContext = createContext9();
var MAX_HISTORY = 100;
function PromptProvider(props) {
  const [value, setValue] = createSignal7("");
  const [history, setHistory] = createSignal7([]);
  const [historyIndex, setHistoryIndex] = createSignal7(-1);
  const [stash, setStash] = createSignal7(null);
  const [isFocused, setIsFocused] = createSignal7(true);
  const [tempValue, setTempValue] = createSignal7("");
  const mode = /* @__PURE__ */ __name(() => {
    const v = value();
    if (v.startsWith("/")) return "command";
    if (v.startsWith("@")) return "file";
    if (v.startsWith("!")) return "shell";
    return "default";
  }, "mode");
  const clear = /* @__PURE__ */ __name(() => {
    setValue("");
    setHistoryIndex(-1);
  }, "clear");
  const addToHistory = /* @__PURE__ */ __name((input) => {
    if (!input.trim()) return;
    setHistory((prev) => {
      if (prev[0] === input) return prev;
      const updated = [input, ...prev];
      return updated.slice(0, MAX_HISTORY);
    });
    setHistoryIndex(-1);
  }, "addToHistory");
  const navigateHistory = /* @__PURE__ */ __name((direction) => {
    const hist = history();
    if (hist.length === 0) return;
    const currentIndex = historyIndex();
    if (direction === "up") {
      if (currentIndex === -1) {
        setTempValue(value());
        setHistoryIndex(0);
        setValue(hist[0]);
      } else if (currentIndex < hist.length - 1) {
        const newIndex = currentIndex + 1;
        setHistoryIndex(newIndex);
        setValue(hist[newIndex]);
      }
    } else {
      if (currentIndex > 0) {
        const newIndex = currentIndex - 1;
        setHistoryIndex(newIndex);
        setValue(hist[newIndex]);
      } else if (currentIndex === 0) {
        setHistoryIndex(-1);
        setValue(tempValue());
      }
    }
  }, "navigateHistory");
  const saveToStash = /* @__PURE__ */ __name(() => {
    const v = value();
    if (v.trim()) {
      setStash(v);
      clear();
    }
  }, "saveToStash");
  const restoreFromStash = /* @__PURE__ */ __name(() => {
    const s = stash();
    if (s) {
      setValue(s);
      setStash(null);
    }
  }, "restoreFromStash");
  const focus = /* @__PURE__ */ __name(() => setIsFocused(true), "focus");
  const blur = /* @__PURE__ */ __name(() => setIsFocused(false), "blur");
  return _$createComponent9(PromptContext.Provider, {
    value: {
      value,
      setValue,
      clear,
      mode,
      history,
      historyIndex,
      addToHistory,
      navigateHistory,
      stash,
      saveToStash,
      restoreFromStash,
      isFocused,
      focus,
      blur
    },
    get children() {
      return props.children;
    }
  });
}
__name(PromptProvider, "PromptProvider");
function usePrompt() {
  const context = useContext9(PromptContext);
  if (!context) {
    throw new Error("usePrompt must be used within PromptProvider");
  }
  return context;
}
__name(usePrompt, "usePrompt");

// src/tui/context/keybind.tsx
import { createComponent as _$createComponent10 } from "solid-js/web";
import { createContext as createContext10, useContext as useContext10, createSignal as createSignal8 } from "solid-js";
var KeybindContext = createContext10();
var defaultBindings = [{
  key: "c",
  ctrl: true,
  action: "exit"
}, {
  key: "p",
  ctrl: true,
  action: "command.open"
}, {
  key: "m",
  ctrl: true,
  action: "model.switch"
}, {
  key: "t",
  ctrl: true,
  action: "theme.toggle"
}, {
  key: "l",
  ctrl: true,
  action: "prompt.clear"
}, {
  key: "s",
  ctrl: true,
  action: "session.list"
}, {
  key: "o",
  ctrl: true,
  action: "output.expand"
}, {
  key: "n",
  ctrl: true,
  action: "session.new"
}];
function KeybindProvider(props) {
  const [bindings, setBindings] = createSignal8(defaultBindings);
  const register = /* @__PURE__ */ __name((keybind) => {
    setBindings((prev) => {
      const exists = prev.findIndex((b) => b.action === keybind.action);
      if (exists >= 0) {
        const updated = [...prev];
        updated[exists] = keybind;
        return updated;
      }
      return [...prev, keybind];
    });
  }, "register");
  const unregister = /* @__PURE__ */ __name((action) => {
    setBindings((prev) => prev.filter((b) => b.action !== action));
  }, "unregister");
  const match = /* @__PURE__ */ __name((event) => {
    const binding = bindings().find((b) => {
      if (b.key.toLowerCase() !== event.key.toLowerCase()) return false;
      if (!!b.ctrl !== !!event.ctrl) return false;
      if (!!b.alt !== !!event.alt) return false;
      if (!!b.shift !== !!event.shift) return false;
      if (!!b.meta !== !!event.meta) return false;
      return true;
    });
    return binding?.action || null;
  }, "match");
  const getBindingForAction = /* @__PURE__ */ __name((action) => {
    return bindings().find((b) => b.action === action);
  }, "getBindingForAction");
  const formatKeybind = /* @__PURE__ */ __name((keybind) => {
    const parts = [];
    if (keybind.ctrl) parts.push("^");
    if (keybind.alt) parts.push("Alt+");
    if (keybind.shift) parts.push("Shift+");
    if (keybind.meta) parts.push("Cmd+");
    parts.push(keybind.key.toUpperCase());
    return parts.join("");
  }, "formatKeybind");
  return _$createComponent10(KeybindContext.Provider, {
    value: {
      bindings,
      register,
      unregister,
      match,
      getBindingForAction,
      formatKeybind
    },
    get children() {
      return props.children;
    }
  });
}
__name(KeybindProvider, "KeybindProvider");
function useKeybind() {
  const context = useContext10(KeybindContext);
  if (!context) {
    throw new Error("useKeybind must be used within KeybindProvider");
  }
  return context;
}
__name(useKeybind, "useKeybind");

// src/tui/routes/home.tsx
import { memo as _$memo } from "solid-js/web";
import { effect as _$effect } from "solid-js/web";
import { insert as _$insert } from "solid-js/web";
import { createComponent as _$createComponent11 } from "solid-js/web";
import { createTextNode as _$createTextNode } from "solid-js/web";
import { insertNode as _$insertNode } from "solid-js/web";
import { setProp as _$setProp } from "solid-js/web";
import { createElement as _$createElement } from "solid-js/web";
import { For } from "solid-js";
function Home() {
  const route = useRoute();
  const {
    theme
  } = useTheme();
  const {
    formatKeybind,
    getBindingForAction
  } = useKeybind();
  const shortcuts = [{
    action: "session.new",
    label: "New Session"
  }, {
    action: "session.list",
    label: "Session List"
  }, {
    action: "command.open",
    label: "Command Palette"
  }, {
    action: "theme.toggle",
    label: "Toggle Theme"
  }];
  return (() => {
    var _el$ = _$createElement("box"), _el$2 = _$createElement("box"), _el$3 = _$createElement("text"), _el$5 = _$createElement("text"), _el$7 = _$createElement("box"), _el$8 = _$createElement("text"), _el$0 = _$createElement("box"), _el$1 = _$createElement("text");
    _$insertNode(_el$, _el$2);
    _$insertNode(_el$, _el$5);
    _$insertNode(_el$, _el$7);
    _$insertNode(_el$, _el$0);
    _$setProp(_el$, "flexDirection", "column");
    _$setProp(_el$, "padding", 1);
    _$insertNode(_el$2, _el$3);
    _$setProp(_el$2, "marginBottom", 1);
    _$insertNode(_el$3, _$createTextNode(`
   ______          __     ________    ____
  / ____/___  ____/ /__  / ____/ /   /  _/
 / /   / __ \\/ __  / _ \\/ /   / /    / /
/ /___/ /_/ / /_/ /  __/ /___/ /____/ /
\\____/\\____/\\__,_/\\___/\\____/_____/___/
          `));
    _$setProp(_el$3, "bold", true);
    _$insertNode(_el$5, _$createTextNode(`AI-powered coding assistant`));
    _$insertNode(_el$7, _el$8);
    _$setProp(_el$7, "marginTop", 2);
    _$setProp(_el$7, "flexDirection", "column");
    _$insertNode(_el$8, _$createTextNode(`Quick Actions`));
    _$setProp(_el$8, "bold", true);
    _$setProp(_el$8, "marginBottom", 1);
    _$insert(_el$7, _$createComponent11(For, {
      each: shortcuts,
      children: /* @__PURE__ */ __name((shortcut) => {
        const binding = getBindingForAction(shortcut.action);
        return (() => {
          var _el$11 = _$createElement("box"), _el$12 = _$createElement("text"), _el$13 = _$createElement("text"), _el$14 = _$createTextNode(` `);
          _$insertNode(_el$11, _el$12);
          _$insertNode(_el$11, _el$13);
          _$insert(_el$12, () => binding ? formatKeybind(binding) : "");
          _$insertNode(_el$13, _el$14);
          _$insert(_el$13, () => shortcut.label, null);
          _$effect((_$p) => _$setProp(_el$12, "color", theme().colors.accent, _$p));
          return _el$11;
        })();
      }, "children")
    }), null);
    _$insertNode(_el$0, _el$1);
    _$setProp(_el$0, "marginTop", 2);
    _$insertNode(_el$1, _$createTextNode(`Press Enter or start typing to begin a new session...`));
    _$effect((_p$) => {
      var _v$ = theme().colors.primary, _v$2 = theme().colors.muted, _v$3 = theme().colors.muted;
      _v$ !== _p$.e && (_p$.e = _$setProp(_el$3, "color", _v$, _p$.e));
      _v$2 !== _p$.t && (_p$.t = _$setProp(_el$5, "color", _v$2, _p$.t));
      _v$3 !== _p$.a && (_p$.a = _$setProp(_el$1, "color", _v$3, _p$.a));
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0
    });
    return _el$;
  })();
}
__name(Home, "Home");

// src/tui/routes/session/index.tsx
import { insertNode as _$insertNode15 } from "solid-js/web";
import { insert as _$insert15 } from "solid-js/web";
import { createComponent as _$createComponent23 } from "solid-js/web";
import { setProp as _$setProp15 } from "solid-js/web";
import { createElement as _$createElement15 } from "solid-js/web";
import { Show as Show10, createSignal as createSignal16, createEffect as createEffect4, onCleanup as onCleanup4 } from "solid-js";

// src/tui/routes/session/header.tsx
import { effect as _$effect2 } from "solid-js/web";
import { insert as _$insert2 } from "solid-js/web";
import { createTextNode as _$createTextNode2 } from "solid-js/web";
import { insertNode as _$insertNode2 } from "solid-js/web";
import { setProp as _$setProp2 } from "solid-js/web";
import { createElement as _$createElement2 } from "solid-js/web";
import { createMemo } from "solid-js";
function Header() {
  const {
    theme
  } = useTheme();
  const {
    getModel
  } = useAgent();
  const {
    formatKeybind,
    getBindingForAction
  } = useKeybind();
  const modelDisplay = createMemo(() => {
    const model = getModel();
    if (model.includes("claude")) {
      if (model.includes("opus")) return "claude-opus";
      if (model.includes("sonnet")) return "claude-sonnet";
      if (model.includes("haiku")) return "claude-haiku";
    }
    return model.split("/").pop() || model;
  });
  const shortcuts = createMemo(() => {
    const bindings = [{
      action: "exit",
      label: "quit"
    }, {
      action: "command.open",
      label: "cmds"
    }, {
      action: "output.expand",
      label: "output"
    }];
    return bindings.map((b) => {
      const binding = getBindingForAction(b.action);
      return binding ? `${formatKeybind(binding)} ${b.label}` : null;
    }).filter(Boolean);
  });
  return (() => {
    var _el$ = _$createElement2("box"), _el$2 = _$createElement2("box"), _el$3 = _$createElement2("text"), _el$5 = _$createElement2("text"), _el$7 = _$createElement2("text"), _el$8 = _$createElement2("box");
    _$insertNode2(_el$, _el$2);
    _$insertNode2(_el$, _el$8);
    _$setProp2(_el$, "borderStyle", "single");
    _$setProp2(_el$, "borderBottom", true);
    _$setProp2(_el$, "paddingX", 1);
    _$setProp2(_el$, "flexDirection", "row");
    _$setProp2(_el$, "justifyContent", "space-between");
    _$insertNode2(_el$2, _el$3);
    _$insertNode2(_el$2, _el$5);
    _$insertNode2(_el$2, _el$7);
    _$setProp2(_el$2, "flexDirection", "row");
    _$setProp2(_el$2, "gap", 2);
    _$insertNode2(_el$3, _$createTextNode2(`CodeCLI`));
    _$setProp2(_el$3, "bold", true);
    _$insertNode2(_el$5, _$createTextNode2(`|`));
    _$insert2(_el$7, modelDisplay);
    _$setProp2(_el$8, "flexDirection", "row");
    _$setProp2(_el$8, "gap", 2);
    _$insert2(_el$8, () => shortcuts().map((shortcut) => (() => {
      var _el$9 = _$createElement2("text");
      _$insert2(_el$9, shortcut);
      _$effect2((_$p) => _$setProp2(_el$9, "color", theme().colors.muted, _$p));
      return _el$9;
    })()));
    _$effect2((_p$) => {
      var _v$ = theme().colors.primary, _v$2 = theme().colors.muted, _v$3 = theme().colors.accent;
      _v$ !== _p$.e && (_p$.e = _$setProp2(_el$3, "color", _v$, _p$.e));
      _v$2 !== _p$.t && (_p$.t = _$setProp2(_el$5, "color", _v$2, _p$.t));
      _v$3 !== _p$.a && (_p$.a = _$setProp2(_el$7, "color", _v$3, _p$.a));
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0
    });
    return _el$;
  })();
}
__name(Header, "Header");

// src/tui/routes/session/footer.tsx
import { createComponent as _$createComponent12 } from "solid-js/web";
import { effect as _$effect3 } from "solid-js/web";
import { createTextNode as _$createTextNode3 } from "solid-js/web";
import { insertNode as _$insertNode3 } from "solid-js/web";
import { insert as _$insert3 } from "solid-js/web";
import { memo as _$memo2 } from "solid-js/web";
import { setProp as _$setProp3 } from "solid-js/web";
import { createElement as _$createElement3 } from "solid-js/web";
import { Show, createMemo as createMemo2, createSignal as createSignal9, createEffect as createEffect2, onCleanup as onCleanup2 } from "solid-js";
function Footer() {
  const {
    theme
  } = useTheme();
  const {
    state
  } = useSync();
  const {
    mode
  } = usePrompt();
  const [elapsed, setElapsed] = createSignal9(0);
  createEffect2(() => {
    if (state.isProcessing && state.processingStartTime) {
      const interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - state.processingStartTime) / 1e3));
      }, 1e3);
      onCleanup2(() => clearInterval(interval));
    } else {
      setElapsed(0);
    }
  });
  const formatElapsed = /* @__PURE__ */ __name((seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }, "formatElapsed");
  const modeIndicator = createMemo2(() => {
    const m = mode();
    switch (m) {
      case "command":
        return {
          label: "CMD",
          color: theme().colors.accent
        };
      case "file":
        return {
          label: "FILE",
          color: theme().colors.info
        };
      case "shell":
        return {
          label: "SHELL",
          color: theme().colors.warning
        };
      default:
        return null;
    }
  });
  const spinnerFrames = ["\u280B", "\u2819", "\u2839", "\u2838", "\u283C", "\u2834", "\u2826", "\u2827", "\u2807", "\u280F"];
  const [spinnerIndex, setSpinnerIndex] = createSignal9(0);
  createEffect2(() => {
    if (state.isProcessing) {
      const interval = setInterval(() => {
        setSpinnerIndex((i) => (i + 1) % spinnerFrames.length);
      }, 80);
      onCleanup2(() => clearInterval(interval));
    }
  });
  return (() => {
    var _el$ = _$createElement3("box"), _el$2 = _$createElement3("box"), _el$0 = _$createElement3("box"), _el$1 = _$createElement3("text");
    _$insertNode3(_el$, _el$2);
    _$insertNode3(_el$, _el$0);
    _$setProp3(_el$, "borderStyle", "single");
    _$setProp3(_el$, "borderTop", true);
    _$setProp3(_el$, "paddingX", 1);
    _$setProp3(_el$, "flexDirection", "row");
    _$setProp3(_el$, "justifyContent", "space-between");
    _$setProp3(_el$2, "flexDirection", "row");
    _$setProp3(_el$2, "gap", 2);
    _$insert3(_el$2, _$createComponent12(Show, {
      get when() {
        return state.isProcessing;
      },
      get children() {
        return [(() => {
          var _el$3 = _$createElement3("text"), _el$4 = _$createTextNode3(` `);
          _$insertNode3(_el$3, _el$4);
          _$insert3(_el$3, () => spinnerFrames[spinnerIndex()], _el$4);
          _$insert3(_el$3, () => state.status.message || "Processing...", null);
          _$effect3((_$p) => _$setProp3(_el$3, "color", theme().colors.primary, _$p));
          return _el$3;
        })(), (() => {
          var _el$5 = _$createElement3("text"), _el$6 = _$createTextNode3(`(`), _el$7 = _$createTextNode3(`)`);
          _$insertNode3(_el$5, _el$6);
          _$insertNode3(_el$5, _el$7);
          _$insert3(_el$5, () => formatElapsed(elapsed()), _el$7);
          _$effect3((_$p) => _$setProp3(_el$5, "color", theme().colors.muted, _$p));
          return _el$5;
        })()];
      }
    }), null);
    _$insert3(_el$2, _$createComponent12(Show, {
      get when() {
        return !state.isProcessing;
      },
      get children() {
        var _el$8 = _$createElement3("text"), _el$9 = _$createTextNode3(` Ready`);
        _$insertNode3(_el$8, _el$9);
        _$insert3(_el$8, () => theme().icons.success, _el$9);
        _$effect3((_$p) => _$setProp3(_el$8, "color", theme().colors.success, _$p));
        return _el$8;
      }
    }), null);
    _$insert3(_el$2, _$createComponent12(Show, {
      get when() {
        return modeIndicator();
      },
      children: /* @__PURE__ */ __name((indicator) => (() => {
        var _el$11 = _$createElement3("text"), _el$12 = _$createTextNode3(`[`), _el$13 = _$createTextNode3(`]`);
        _$insertNode3(_el$11, _el$12);
        _$insertNode3(_el$11, _el$13);
        _$setProp3(_el$11, "bold", true);
        _$insert3(_el$11, () => indicator().label, _el$13);
        _$effect3((_$p) => _$setProp3(_el$11, "color", indicator().color, _$p));
        return _el$11;
      })(), "children")
    }), null);
    _$insertNode3(_el$0, _el$1);
    _$setProp3(_el$0, "flexDirection", "row");
    _$setProp3(_el$0, "gap", 2);
    _$insertNode3(_el$1, _$createTextNode3(`/ command | @ file | ! shell`));
    _$effect3((_$p) => _$setProp3(_el$1, "color", theme().colors.muted, _$p));
    return _el$;
  })();
}
__name(Footer, "Footer");

// src/tui/routes/session/sidebar.tsx
import { memo as _$memo3 } from "solid-js/web";
import { effect as _$effect4 } from "solid-js/web";
import { createComponent as _$createComponent13 } from "solid-js/web";
import { insert as _$insert4 } from "solid-js/web";
import { createTextNode as _$createTextNode4 } from "solid-js/web";
import { insertNode as _$insertNode4 } from "solid-js/web";
import { setProp as _$setProp4 } from "solid-js/web";
import { createElement as _$createElement4 } from "solid-js/web";
import { Show as Show2, For as For2, createMemo as createMemo3 } from "solid-js";
function Sidebar() {
  const {
    theme
  } = useTheme();
  const {
    state
  } = useSync();
  const {
    getModel
  } = useAgent();
  const activeTodos = createMemo3(() => state.todos.filter((t) => t.status === "in_progress"));
  const pendingTodos = createMemo3(() => state.todos.filter((t) => t.status === "pending"));
  const completedTodos = createMemo3(() => state.todos.filter((t) => t.status === "completed"));
  const todoProgress = createMemo3(() => {
    const total = state.todos.length;
    if (total === 0) return 0;
    return Math.round(completedTodos().length / total * 100);
  });
  return (() => {
    var _el$ = _$createElement4("box"), _el$2 = _$createElement4("box"), _el$3 = _$createElement4("text"), _el$5 = _$createElement4("text"), _el$6 = _$createTextNode4(`Model: `), _el$7 = _$createElement4("text"), _el$26 = _$createElement4("box"), _el$27 = _$createElement4("text"), _el$31 = _$createElement4("box"), _el$32 = _$createElement4("text");
    _$insertNode4(_el$, _el$2);
    _$insertNode4(_el$, _el$7);
    _$insertNode4(_el$, _el$26);
    _$insertNode4(_el$, _el$31);
    _$insertNode4(_el$, _el$32);
    _$setProp4(_el$, "width", 30);
    _$setProp4(_el$, "borderStyle", "single");
    _$setProp4(_el$, "borderLeft", true);
    _$setProp4(_el$, "flexDirection", "column");
    _$setProp4(_el$, "padding", 1);
    _$insertNode4(_el$2, _el$3);
    _$insertNode4(_el$2, _el$5);
    _$setProp4(_el$2, "flexDirection", "column");
    _$setProp4(_el$2, "marginBottom", 1);
    _$insertNode4(_el$3, _$createTextNode4(`Session`));
    _$setProp4(_el$3, "bold", true);
    _$insertNode4(_el$5, _el$6);
    _$setProp4(_el$5, "wrap", "truncate");
    _$insert4(_el$5, () => getModel().split("/").pop(), null);
    _$insertNode4(_el$7, _$createTextNode4(`\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`));
    _$insert4(_el$, _$createComponent13(Show2, {
      get when() {
        return state.todos.length > 0;
      },
      get children() {
        return [(() => {
          var _el$9 = _$createElement4("box"), _el$0 = _$createElement4("box"), _el$1 = _$createElement4("text"), _el$11 = _$createElement4("text"), _el$12 = _$createTextNode4(`/`), _el$13 = _$createElement4("box"), _el$14 = _$createElement4("text"), _el$16 = _$createElement4("text"), _el$17 = _$createElement4("text"), _el$18 = _$createElement4("text"), _el$19 = _$createTextNode4(`] `), _el$20 = _$createTextNode4(`%`);
          _$insertNode4(_el$9, _el$0);
          _$insertNode4(_el$9, _el$13);
          _$setProp4(_el$9, "flexDirection", "column");
          _$setProp4(_el$9, "marginY", 1);
          _$insertNode4(_el$0, _el$1);
          _$insertNode4(_el$0, _el$11);
          _$setProp4(_el$0, "flexDirection", "row");
          _$setProp4(_el$0, "justifyContent", "space-between");
          _$insertNode4(_el$1, _$createTextNode4(`Tasks`));
          _$setProp4(_el$1, "bold", true);
          _$insertNode4(_el$11, _el$12);
          _$insert4(_el$11, () => completedTodos().length, _el$12);
          _$insert4(_el$11, () => state.todos.length, null);
          _$insertNode4(_el$13, _el$14);
          _$insertNode4(_el$13, _el$16);
          _$insertNode4(_el$13, _el$17);
          _$insertNode4(_el$13, _el$18);
          _$setProp4(_el$13, "marginY", 1);
          _$insertNode4(_el$14, _$createTextNode4(`[`));
          _$insert4(_el$16, () => "\u2588".repeat(Math.floor(todoProgress() / 5)));
          _$insert4(_el$17, () => "\u2591".repeat(20 - Math.floor(todoProgress() / 5)));
          _$insertNode4(_el$18, _el$19);
          _$insertNode4(_el$18, _el$20);
          _$insert4(_el$18, todoProgress, _el$20);
          _$insert4(_el$9, _$createComponent13(Show2, {
            get when() {
              return activeTodos().length > 0;
            },
            get children() {
              return _$createComponent13(For2, {
                get each() {
                  return activeTodos();
                },
                children: /* @__PURE__ */ __name((todo) => (() => {
                  var _el$34 = _$createElement4("box"), _el$35 = _$createElement4("text"), _el$36 = _$createTextNode4(` `), _el$37 = _$createElement4("text");
                  _$insertNode4(_el$34, _el$35);
                  _$insertNode4(_el$34, _el$37);
                  _$insertNode4(_el$35, _el$36);
                  _$insert4(_el$35, () => theme().icons.active, _el$36);
                  _$setProp4(_el$37, "wrap", "truncate");
                  _$insert4(_el$37, () => todo.activeForm || todo.content);
                  _$effect4((_$p) => _$setProp4(_el$35, "color", theme().colors.warning, _$p));
                  return _el$34;
                })(), "children")
              });
            }
          }), null);
          _$insert4(_el$9, _$createComponent13(Show2, {
            get when() {
              return pendingTodos().length > 0;
            },
            get children() {
              return [_$createComponent13(For2, {
                get each() {
                  return pendingTodos().slice(0, 3);
                },
                children: /* @__PURE__ */ __name((todo) => (() => {
                  var _el$38 = _$createElement4("box"), _el$39 = _$createElement4("text"), _el$40 = _$createTextNode4(` `), _el$41 = _$createElement4("text");
                  _$insertNode4(_el$38, _el$39);
                  _$insertNode4(_el$38, _el$41);
                  _$insertNode4(_el$39, _el$40);
                  _$insert4(_el$39, () => theme().icons.pending, _el$40);
                  _$setProp4(_el$41, "wrap", "truncate");
                  _$insert4(_el$41, () => todo.content);
                  _$effect4((_p$) => {
                    var _v$0 = theme().colors.muted, _v$1 = theme().colors.muted;
                    _v$0 !== _p$.e && (_p$.e = _$setProp4(_el$39, "color", _v$0, _p$.e));
                    _v$1 !== _p$.t && (_p$.t = _$setProp4(_el$41, "color", _v$1, _p$.t));
                    return _p$;
                  }, {
                    e: void 0,
                    t: void 0
                  });
                  return _el$38;
                })(), "children")
              }), _$createComponent13(Show2, {
                get when() {
                  return pendingTodos().length > 3;
                },
                get children() {
                  var _el$21 = _$createElement4("text"), _el$22 = _$createTextNode4(`+`), _el$23 = _$createTextNode4(` more...`);
                  _$insertNode4(_el$21, _el$22);
                  _$insertNode4(_el$21, _el$23);
                  _$insert4(_el$21, () => pendingTodos().length - 3, _el$23);
                  _$effect4((_$p) => _$setProp4(_el$21, "color", theme().colors.muted, _$p));
                  return _el$21;
                }
              })];
            }
          }), null);
          _$effect4((_p$) => {
            var _v$ = theme().colors.muted, _v$2 = theme().colors.muted, _v$3 = theme().colors.success, _v$4 = theme().colors.border, _v$5 = theme().colors.muted;
            _v$ !== _p$.e && (_p$.e = _$setProp4(_el$11, "color", _v$, _p$.e));
            _v$2 !== _p$.t && (_p$.t = _$setProp4(_el$14, "color", _v$2, _p$.t));
            _v$3 !== _p$.a && (_p$.a = _$setProp4(_el$16, "color", _v$3, _p$.a));
            _v$4 !== _p$.o && (_p$.o = _$setProp4(_el$17, "color", _v$4, _p$.o));
            _v$5 !== _p$.i && (_p$.i = _$setProp4(_el$18, "color", _v$5, _p$.i));
            return _p$;
          }, {
            e: void 0,
            t: void 0,
            a: void 0,
            o: void 0,
            i: void 0
          });
          return _el$9;
        })(), (() => {
          var _el$24 = _$createElement4("text");
          _$insertNode4(_el$24, _$createTextNode4(`\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`));
          _$effect4((_$p) => _$setProp4(_el$24, "color", theme().colors.border, _$p));
          return _el$24;
        })()];
      }
    }), _el$26);
    _$insertNode4(_el$26, _el$27);
    _$setProp4(_el$26, "flexDirection", "column");
    _$setProp4(_el$26, "marginY", 1);
    _$insertNode4(_el$27, _$createTextNode4(`Status`));
    _$setProp4(_el$27, "bold", true);
    _$insert4(_el$26, _$createComponent13(Show2, {
      get when() {
        return state.isProcessing;
      },
      get fallback() {
        return (() => {
          var _el$42 = _$createElement4("text"), _el$43 = _$createTextNode4(` Idle`);
          _$insertNode4(_el$42, _el$43);
          _$insert4(_el$42, () => theme().icons.success, _el$43);
          _$effect4((_$p) => _$setProp4(_el$42, "color", theme().colors.success, _$p));
          return _el$42;
        })();
      },
      get children() {
        var _el$29 = _$createElement4("text"), _el$30 = _$createTextNode4(` Processing`);
        _$insertNode4(_el$29, _el$30);
        _$insert4(_el$29, () => theme().icons.active, _el$30);
        _$effect4((_$p) => _$setProp4(_el$29, "color", theme().colors.warning, _$p));
        return _el$29;
      }
    }), null);
    _$setProp4(_el$31, "flexGrow", 1);
    _$insertNode4(_el$32, _$createTextNode4(`^P command palette`));
    _$setProp4(_el$32, "wrap", "wrap");
    _$effect4((_p$) => {
      var _v$6 = theme().colors.primary, _v$7 = theme().colors.muted, _v$8 = theme().colors.border, _v$9 = theme().colors.muted;
      _v$6 !== _p$.e && (_p$.e = _$setProp4(_el$3, "color", _v$6, _p$.e));
      _v$7 !== _p$.t && (_p$.t = _$setProp4(_el$5, "color", _v$7, _p$.t));
      _v$8 !== _p$.a && (_p$.a = _$setProp4(_el$7, "color", _v$8, _p$.a));
      _v$9 !== _p$.o && (_p$.o = _$setProp4(_el$32, "color", _v$9, _p$.o));
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0,
      o: void 0
    });
    return _el$;
  })();
}
__name(Sidebar, "Sidebar");

// src/tui/routes/session/messages.tsx
import { insert as _$insert9 } from "solid-js/web";
import { memo as _$memo7 } from "solid-js/web";
import { createComponent as _$createComponent17 } from "solid-js/web";
import { effect as _$effect8 } from "solid-js/web";
import { createTextNode as _$createTextNode8 } from "solid-js/web";
import { insertNode as _$insertNode9 } from "solid-js/web";
import { setProp as _$setProp9 } from "solid-js/web";
import { createElement as _$createElement9 } from "solid-js/web";
import { For as For3, Show as Show6, createMemo as createMemo8 } from "solid-js";

// src/tui/component/message/assistant-message.tsx
import { memo as _$memo6 } from "solid-js/web";
import { createComponent as _$createComponent16 } from "solid-js/web";
import { effect as _$effect7 } from "solid-js/web";
import { insert as _$insert8 } from "solid-js/web";
import { createTextNode as _$createTextNode7 } from "solid-js/web";
import { insertNode as _$insertNode8 } from "solid-js/web";
import { setProp as _$setProp8 } from "solid-js/web";
import { createElement as _$createElement8 } from "solid-js/web";
import { Show as Show5, createMemo as createMemo7 } from "solid-js";

// src/tui/component/message/text-part.tsx
import { insertNode as _$insertNode5 } from "solid-js/web";
import { insert as _$insert5 } from "solid-js/web";
import { setProp as _$setProp5 } from "solid-js/web";
import { createElement as _$createElement5 } from "solid-js/web";
import { createMemo as createMemo4 } from "solid-js";

// src/utils/colors.ts
var colors = {
  reset: "\x1B[0m",
  cyan: "\x1B[96m",
  yellow: "\x1B[93m",
  green: "\x1B[92m",
  red: "\x1B[91m",
  blue: "\x1B[94m",
  magenta: "\x1B[95m",
  gray: "\x1B[90m",
  bold: "\x1B[1m",
  italic: "\x1B[3m",
  underline: "\x1B[4m",
  white: "\x1B[97m",
  // Background colors for diff rendering
  bgGreen: "\x1B[42m",
  bgRed: "\x1B[41m",
  bgYellow: "\x1B[43m",
  // Dim background variants (for subtle highlighting)
  bgGreenDim: "\x1B[48;5;22m",
  // Dark green background
  bgRedDim: "\x1B[48;5;52m"
  // Dark red background
};

// src/utils/markdown.ts
var allowedBareExtensions = /* @__PURE__ */ new Set([
  "ts",
  "tsx",
  "js",
  "jsx",
  "json",
  "md",
  "py",
  "java",
  "yml",
  "yaml",
  "sh",
  "html",
  "css",
  "scss",
  "gradle",
  "xml",
  "lock",
  "toml",
  "ini",
  "env"
]);
var candidatePathRegex = /\b[A-Za-z0-9._-]+(?:[\\/][A-Za-z0-9._-]+)*\.[A-Za-z]{1,8}\b/g;
var pathStyle = `${colors.bold}${colors.cyan}`;
function renderMarkdownToAnsi(markdown) {
  const normalized = markdown.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const output = [];
  let inCodeFence = false;
  let fenceDelimiter = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fenceMatch = line.match(/^\s*(```|~~~)(.*)$/);
    if (fenceMatch) {
      const delim = fenceMatch[1];
      if (!inCodeFence) {
        inCodeFence = true;
        fenceDelimiter = delim;
        output.push(`${colors.gray}${line.trimEnd()}${colors.reset}`);
      } else if (fenceDelimiter === delim) {
        inCodeFence = false;
        fenceDelimiter = null;
        output.push(`${colors.gray}${line.trimEnd()}${colors.reset}`);
      } else {
        output.push(`${colors.gray}${line.trimEnd()}${colors.reset}`);
      }
      continue;
    }
    if (inCodeFence) {
      output.push(`${colors.gray}${line}${colors.reset}`);
      continue;
    }
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      const headingColor = level === 1 ? colors.cyan : level === 2 ? colors.blue : colors.magenta;
      output.push(
        `${headingColor}${colors.bold}${renderInline(text)}${colors.reset}`
      );
      continue;
    }
    if (/^\s*([-*_])\1{2,}\s*$/.test(line)) {
      output.push(`${colors.gray}${"\u2500".repeat(50)}${colors.reset}`);
      continue;
    }
    const blockquoteMatch = line.match(/^\s*>\s?(.*)$/);
    if (blockquoteMatch) {
      output.push(
        `${colors.gray}\u2502 ${colors.reset}${renderInline(blockquoteMatch[1])}`
      );
      continue;
    }
    const taskMatch = line.match(/^(\s*)[-+*]\s+\[( |x|X)\]\s+(.*)$/);
    if (taskMatch) {
      const indent = taskMatch[1];
      const checked = taskMatch[2].toLowerCase() === "x";
      const box = checked ? `${colors.green}\u2611${colors.reset}` : `${colors.gray}\u2610${colors.reset}`;
      output.push(`${indent}${box} ${renderInline(taskMatch[3])}`);
      continue;
    }
    const orderedMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
    if (orderedMatch) {
      const indent = orderedMatch[1];
      const num = orderedMatch[2];
      output.push(
        `${indent}${colors.yellow}${num}.${colors.reset} ${renderInline(
          orderedMatch[3]
        )}`
      );
      continue;
    }
    const unorderedMatch = line.match(/^(\s*)[-+*]\s+(.*)$/);
    if (unorderedMatch) {
      const indent = unorderedMatch[1];
      output.push(
        `${indent}${colors.yellow}\u2022${colors.reset} ${renderInline(
          unorderedMatch[2]
        )}`
      );
      continue;
    }
    if (looksLikeTableHeader(line, lines[i + 1])) {
      output.push(renderTableLine(line, true));
      output.push(`${colors.gray}${lines[i + 1].trimEnd()}${colors.reset}`);
      i++;
      continue;
    }
    if (looksLikeTableRow(line)) {
      output.push(renderTableLine(line, false));
      continue;
    }
    output.push(renderInline(line));
  }
  return output.join("\n");
}
__name(renderMarkdownToAnsi, "renderMarkdownToAnsi");
function renderInline(text) {
  return renderTokens(parseInline(text), []);
}
__name(renderInline, "renderInline");
function renderTokens(tokens, styleStack) {
  let output = "";
  for (const token of tokens) {
    switch (token.type) {
      case "text":
        output += highlightPaths(token.content, styleStack.join(""));
        break;
      case "code": {
        const newStack = [...styleStack, colors.cyan];
        output += colors.cyan;
        output += highlightPaths(token.content, newStack.join(""));
        output += colors.reset + styleStack.join("");
        break;
      }
      case "bold": {
        const newStack = [...styleStack, colors.bold];
        output += colors.bold;
        output += renderTokens(token.children, newStack);
        output += colors.reset + styleStack.join("");
        break;
      }
      case "italic": {
        const newStack = [...styleStack, colors.italic];
        output += colors.italic;
        output += renderTokens(token.children, newStack);
        output += colors.reset + styleStack.join("");
        break;
      }
      case "boldItalic": {
        const newStack = [...styleStack, colors.bold, colors.italic];
        output += colors.bold + colors.italic;
        output += renderTokens(token.children, newStack);
        output += colors.reset + styleStack.join("");
        break;
      }
      case "strike": {
        const newStack = [...styleStack, colors.gray];
        output += colors.gray;
        output += renderTokens(token.children, newStack);
        output += colors.reset + styleStack.join("");
        break;
      }
      case "link": {
        const newStack = [...styleStack, colors.blue, colors.underline];
        output += colors.blue + colors.underline;
        output += renderTokens(token.children, newStack);
        output += colors.reset + styleStack.join("");
        output += `${colors.gray} (${token.url})${colors.reset}${styleStack.join("")}`;
        break;
      }
      default:
        break;
    }
  }
  return output;
}
__name(renderTokens, "renderTokens");
function parseInline(text) {
  const tokens = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === "\\" && i + 1 < text.length) {
      tokens.push({ type: "text", content: text[i + 1] });
      i += 2;
      continue;
    }
    if (text.startsWith("```", i) || text.startsWith("~~~", i)) {
      tokens.push({ type: "text", content: ch });
      i++;
      continue;
    }
    if (ch === "`") {
      const end = findDelimiter(text, i + 1, "`");
      if (end !== -1) {
        tokens.push({ type: "code", content: text.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }
    if (text.startsWith("[", i)) {
      const closeBracket = findDelimiter(text, i + 1, "]");
      if (closeBracket !== -1 && text[closeBracket + 1] === "(") {
        const closeParen = findDelimiter(text, closeBracket + 2, ")");
        if (closeParen !== -1) {
          const linkText = text.slice(i + 1, closeBracket);
          const url = text.slice(closeBracket + 2, closeParen);
          tokens.push({
            type: "link",
            children: parseInline(linkText),
            url
          });
          i = closeParen + 1;
          continue;
        }
      }
    }
    if (text.startsWith("***", i) || text.startsWith("___", i)) {
      const delim = text.slice(i, i + 3);
      const end = findDelimiter(text, i + 3, delim);
      if (end !== -1) {
        tokens.push({
          type: "boldItalic",
          children: parseInline(text.slice(i + 3, end))
        });
        i = end + 3;
        continue;
      }
    }
    if (text.startsWith("**", i) || text.startsWith("__", i)) {
      const delim = text.slice(i, i + 2);
      const end = findDelimiter(text, i + 2, delim);
      if (end !== -1) {
        tokens.push({
          type: "bold",
          children: parseInline(text.slice(i + 2, end))
        });
        i = end + 2;
        continue;
      }
    }
    if (text.startsWith("~~", i)) {
      const end = findDelimiter(text, i + 2, "~~");
      if (end !== -1) {
        tokens.push({
          type: "strike",
          children: parseInline(text.slice(i + 2, end))
        });
        i = end + 2;
        continue;
      }
    }
    if (ch === "*" || ch === "_") {
      const prev = text[i - 1];
      const next = text[i + 1];
      const looksLikeWordBoundary = isWordChar(prev) && !isWordChar(next) || !isWordChar(prev) && isWordChar(next);
      if (looksLikeWordBoundary) {
        const end = findDelimiter(text, i + 1, ch);
        if (end !== -1) {
          tokens.push({
            type: "italic",
            children: parseInline(text.slice(i + 1, end))
          });
          i = end + 1;
          continue;
        }
      }
    }
    const nextSpecial = findNextSpecialIndex(text, i);
    const endIndex = nextSpecial === -1 ? text.length : nextSpecial;
    if (endIndex === i) {
      tokens.push({ type: "text", content: ch });
      i++;
      continue;
    }
    tokens.push({ type: "text", content: text.slice(i, endIndex) });
    i = endIndex;
  }
  return tokens;
}
__name(parseInline, "parseInline");
function findDelimiter(text, startIndex, delim) {
  let searchIndex = startIndex;
  while (searchIndex < text.length) {
    const idx = text.indexOf(delim, searchIndex);
    if (idx === -1) return -1;
    if (idx > 0 && text[idx - 1] === "\\") {
      searchIndex = idx + 1;
      continue;
    }
    return idx;
  }
  return -1;
}
__name(findDelimiter, "findDelimiter");
function findNextSpecialIndex(text, startIndex) {
  const specials = ["\\", "`", "[", "*", "_", "~"];
  let min = -1;
  for (const s of specials) {
    const idx = text.indexOf(s, startIndex);
    if (idx !== -1 && (min === -1 || idx < min)) {
      min = idx;
    }
  }
  return min;
}
__name(findNextSpecialIndex, "findNextSpecialIndex");
function isWordChar(ch) {
  return !!ch && /[A-Za-z0-9]/.test(ch);
}
__name(isWordChar, "isWordChar");
function highlightPaths(text, baseStyle) {
  candidatePathRegex.lastIndex = 0;
  let result = "";
  let lastIndex = 0;
  let match;
  while (match = candidatePathRegex.exec(text)) {
    const value = match[0];
    const hasSlash = value.includes("/") || value.includes("\\");
    const ext = value.split(".").pop()?.toLowerCase() ?? "";
    const shouldHighlight = hasSlash || allowedBareExtensions.has(ext);
    result += text.slice(lastIndex, match.index);
    if (shouldHighlight) {
      const restore = baseStyle ? colors.reset + baseStyle : colors.reset;
      result += `${pathStyle}${value}${restore}`;
    } else {
      result += value;
    }
    lastIndex = match.index + value.length;
  }
  result += text.slice(lastIndex);
  return result;
}
__name(highlightPaths, "highlightPaths");
function looksLikeTableHeader(line, nextLine) {
  if (!nextLine) return false;
  return looksLikeTableRow(line) && looksLikeTableSeparator(nextLine);
}
__name(looksLikeTableHeader, "looksLikeTableHeader");
function looksLikeTableRow(line) {
  const trimmed = line.trim();
  if (!trimmed.includes("|")) return false;
  const pipeCount = (trimmed.match(/\|/g) || []).length;
  return pipeCount >= 2;
}
__name(looksLikeTableRow, "looksLikeTableRow");
function looksLikeTableSeparator(line) {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}
__name(looksLikeTableSeparator, "looksLikeTableSeparator");
function renderTableLine(line, isHeader) {
  const trimmed = line.trim();
  const cells = trimmed.replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
  const renderedCells = cells.map(
    (cell) => isHeader ? `${colors.bold}${renderInline(cell)}${colors.reset}` : renderInline(cell)
  );
  return `| ${renderedCells.join(" | ")} |`;
}
__name(renderTableLine, "renderTableLine");

// src/tui/component/message/text-part.tsx
function TextPart(props) {
  const {
    theme
  } = useTheme();
  const renderedContent = createMemo4(() => {
    try {
      return renderMarkdownToAnsi(props.content);
    } catch {
      return props.content;
    }
  });
  return (() => {
    var _el$ = _$createElement5("box"), _el$2 = _$createElement5("text");
    _$insertNode5(_el$, _el$2);
    _$setProp5(_el$, "flexDirection", "column");
    _$setProp5(_el$2, "wrap", "wrap");
    _$insert5(_el$2, renderedContent);
    return _el$;
  })();
}
__name(TextPart, "TextPart");

// src/tui/component/message/tool-part.tsx
import { createComponent as _$createComponent14 } from "solid-js/web";
import { effect as _$effect5 } from "solid-js/web";
import { createTextNode as _$createTextNode5 } from "solid-js/web";
import { insertNode as _$insertNode6 } from "solid-js/web";
import { memo as _$memo4 } from "solid-js/web";
import { insert as _$insert6 } from "solid-js/web";
import { setProp as _$setProp6 } from "solid-js/web";
import { createElement as _$createElement6 } from "solid-js/web";
import { Show as Show3, createMemo as createMemo5, createSignal as createSignal10 } from "solid-js";
var MAX_COLLAPSED_LINES = 10;
var MAX_LINE_LENGTH = 200;
function ToolPart(props) {
  const {
    theme
  } = useTheme();
  const [localExpanded, setLocalExpanded] = createSignal10(false);
  const isExpanded = /* @__PURE__ */ __name(() => props.isExpanded || localExpanded(), "isExpanded");
  const processedContent = createMemo5(() => {
    const content = props.output.displayedResult || props.output.result || "";
    const lines = content.split("\n");
    const needsTruncation = lines.length > MAX_COLLAPSED_LINES;
    const displayLines = isExpanded() ? lines : lines.slice(0, MAX_COLLAPSED_LINES);
    const processed = displayLines.map((line, index) => {
      if (line.length > MAX_LINE_LENGTH && !isExpanded()) {
        return `${line.slice(0, MAX_LINE_LENGTH)}...`;
      }
      return line;
    });
    return {
      lines: processed,
      totalLines: lines.length,
      needsTruncation,
      hiddenLines: lines.length - MAX_COLLAPSED_LINES
    };
  });
  const getToolIcon = /* @__PURE__ */ __name(() => {
    const toolName = props.output.toolName?.toLowerCase() || "";
    if (toolName.includes("read") || toolName.includes("file")) {
      return "\u{1F4C4}";
    }
    if (toolName.includes("write") || toolName.includes("edit")) {
      return "\u270F";
    }
    if (toolName.includes("bash") || toolName.includes("shell")) {
      return "\u{1F4BB}";
    }
    if (toolName.includes("search") || toolName.includes("grep")) {
      return "\u{1F50D}";
    }
    return "\u2699";
  }, "getToolIcon");
  const getStatusColor = /* @__PURE__ */ __name(() => {
    const result = props.output.result || "";
    if (result.toLowerCase().includes("error")) return theme().colors.error;
    return theme().colors.success;
  }, "getStatusColor");
  return (() => {
    var _el$ = _$createElement6("box"), _el$2 = _$createElement6("box"), _el$3 = _$createElement6("box"), _el$4 = _$createElement6("text"), _el$5 = _$createElement6("text"), _el$6 = _$createElement6("text"), _el$7 = _$createElement6("box");
    _$insertNode6(_el$, _el$2);
    _$insertNode6(_el$, _el$7);
    _$setProp6(_el$, "flexDirection", "column");
    _$setProp6(_el$, "borderStyle", "single");
    _$setProp6(_el$, "padding", 1);
    _$insertNode6(_el$2, _el$3);
    _$insertNode6(_el$2, _el$6);
    _$setProp6(_el$2, "flexDirection", "row");
    _$setProp6(_el$2, "justifyContent", "space-between");
    _$setProp6(_el$2, "marginBottom", 1);
    _$insertNode6(_el$3, _el$4);
    _$insertNode6(_el$3, _el$5);
    _$setProp6(_el$3, "flexDirection", "row");
    _$setProp6(_el$3, "gap", 1);
    _$insert6(_el$4, getToolIcon);
    _$setProp6(_el$5, "bold", true);
    _$insert6(_el$5, () => props.output.toolName || "Tool");
    _$insert6(_el$6, (() => {
      var _c$ = _$memo4(() => !!props.output.result?.toLowerCase().includes("error"));
      return () => _c$() ? theme().icons.error : theme().icons.success;
    })());
    _$setProp6(_el$7, "flexDirection", "column");
    _$insert6(_el$7, () => processedContent().lines.map((line, index) => (() => {
      var _el$13 = _$createElement6("box"), _el$14 = _$createElement6("text"), _el$15 = _$createTextNode5(` `), _el$16 = _$createTextNode5(` `), _el$17 = _$createElement6("text");
      _$insertNode6(_el$13, _el$14);
      _$insertNode6(_el$13, _el$17);
      _$setProp6(_el$13, "flexDirection", "row");
      _$insertNode6(_el$14, _el$15);
      _$insertNode6(_el$14, _el$16);
      _$setProp6(_el$14, "dimColor", true);
      _$insert6(_el$14, () => String(index + 1).padStart(4, " "), _el$15);
      _$insert6(_el$14, () => theme().icons.pipe, _el$16);
      _$setProp6(_el$17, "wrap", "truncate");
      _$insert6(_el$17, line);
      _$effect5((_$p) => _$setProp6(_el$14, "color", theme().colors.muted, _$p));
      return _el$13;
    })()));
    _$insert6(_el$, _$createComponent14(Show3, {
      get when() {
        return _$memo4(() => !!processedContent().needsTruncation)() && !isExpanded();
      },
      get children() {
        var _el$8 = _$createElement6("box"), _el$9 = _$createElement6("text"), _el$0 = _$createTextNode5(`... `), _el$1 = _$createTextNode5(` more lines (^O to expand)`);
        _$insertNode6(_el$8, _el$9);
        _$setProp6(_el$8, "marginTop", 1);
        _$insertNode6(_el$9, _el$0);
        _$insertNode6(_el$9, _el$1);
        _$insert6(_el$9, () => processedContent().hiddenLines, _el$1);
        _$effect5((_$p) => _$setProp6(_el$9, "color", theme().colors.muted, _$p));
        return _el$8;
      }
    }), null);
    _$insert6(_el$, _$createComponent14(Show3, {
      get when() {
        return _$memo4(() => !!isExpanded())() && processedContent().needsTruncation;
      },
      get children() {
        var _el$10 = _$createElement6("box"), _el$11 = _$createElement6("text"), _el$12 = _$createTextNode5(` lines total (^O to collapse)`);
        _$insertNode6(_el$10, _el$11);
        _$setProp6(_el$10, "marginTop", 1);
        _$insertNode6(_el$11, _el$12);
        _$insert6(_el$11, () => processedContent().totalLines, _el$12);
        _$effect5((_$p) => _$setProp6(_el$11, "color", theme().colors.muted, _$p));
        return _el$10;
      }
    }), null);
    _$effect5((_p$) => {
      var _v$ = theme().colors.accent, _v$2 = getStatusColor();
      _v$ !== _p$.e && (_p$.e = _$setProp6(_el$5, "color", _v$, _p$.e));
      _v$2 !== _p$.t && (_p$.t = _$setProp6(_el$6, "color", _v$2, _p$.t));
      return _p$;
    }, {
      e: void 0,
      t: void 0
    });
    return _el$;
  })();
}
__name(ToolPart, "ToolPart");

// src/tui/component/message/reasoning-part.tsx
import { createComponent as _$createComponent15 } from "solid-js/web";
import { effect as _$effect6 } from "solid-js/web";
import { memo as _$memo5 } from "solid-js/web";
import { insert as _$insert7 } from "solid-js/web";
import { createTextNode as _$createTextNode6 } from "solid-js/web";
import { insertNode as _$insertNode7 } from "solid-js/web";
import { setProp as _$setProp7 } from "solid-js/web";
import { createElement as _$createElement7 } from "solid-js/web";
import { Show as Show4, createSignal as createSignal11, createMemo as createMemo6 } from "solid-js";
function ReasoningPart(props) {
  const {
    theme
  } = useTheme();
  const [isCollapsed, setIsCollapsed] = createSignal11(props.defaultCollapsed ?? true);
  const reasoningContent = createMemo6(() => {
    const content = props.content;
    const thinkingMatch = content.match(/<thinking>([\s\S]*?)<\/thinking>/);
    if (thinkingMatch) {
      return thinkingMatch[1].trim();
    }
    return content;
  });
  const summary = createMemo6(() => {
    const content = reasoningContent();
    const firstLine = content.split("\n")[0];
    if (firstLine.length > 60) {
      return firstLine.slice(0, 57) + "...";
    }
    return firstLine;
  });
  const lineCount = createMemo6(() => {
    return reasoningContent().split("\n").length;
  });
  return (() => {
    var _el$ = _$createElement7("box"), _el$2 = _$createElement7("box"), _el$3 = _$createElement7("box"), _el$4 = _$createElement7("text"), _el$6 = _$createElement7("text"), _el$8 = _$createElement7("text"), _el$9 = _$createTextNode6(`(`), _el$0 = _$createTextNode6(` lines)`), _el$1 = _$createElement7("text");
    _$insertNode7(_el$, _el$2);
    _$setProp7(_el$, "flexDirection", "column");
    _$setProp7(_el$, "borderStyle", "single");
    _$setProp7(_el$, "padding", 1);
    _$insertNode7(_el$2, _el$3);
    _$insertNode7(_el$2, _el$1);
    _$setProp7(_el$2, "flexDirection", "row");
    _$setProp7(_el$2, "justifyContent", "space-between");
    _$insertNode7(_el$3, _el$4);
    _$insertNode7(_el$3, _el$6);
    _$insertNode7(_el$3, _el$8);
    _$setProp7(_el$3, "flexDirection", "row");
    _$setProp7(_el$3, "gap", 1);
    _$insertNode7(_el$4, _$createTextNode6(`\u{1F4AD}`));
    _$insertNode7(_el$6, _$createTextNode6(`Thinking`));
    _$setProp7(_el$6, "bold", true);
    _$insertNode7(_el$8, _el$9);
    _$insertNode7(_el$8, _el$0);
    _$insert7(_el$8, lineCount, _el$0);
    _$insert7(_el$1, () => isCollapsed() ? "[space to expand]" : "[space to collapse]");
    _$insert7(_el$, _$createComponent15(Show4, {
      get when() {
        return !isCollapsed();
      },
      get fallback() {
        return (() => {
          var _el$12 = _$createElement7("text");
          _$setProp7(_el$12, "italic", true);
          _$insert7(_el$12, summary);
          _$effect6((_$p) => _$setProp7(_el$12, "color", theme().colors.muted, _$p));
          return _el$12;
        })();
      },
      get children() {
        var _el$10 = _$createElement7("box"), _el$11 = _$createElement7("text");
        _$insertNode7(_el$10, _el$11);
        _$setProp7(_el$10, "flexDirection", "column");
        _$setProp7(_el$11, "wrap", "wrap");
        _$insert7(_el$11, reasoningContent);
        _$effect6((_$p) => _$setProp7(_el$11, "color", theme().colors.muted, _$p));
        return _el$10;
      }
    }), null);
    _$effect6((_p$) => {
      var _v$ = theme().colors.muted, _v$2 = isCollapsed() ? 0 : 1, _v$3 = theme().colors.muted, _v$4 = theme().colors.muted, _v$5 = theme().colors.muted, _v$6 = theme().colors.muted;
      _v$ !== _p$.e && (_p$.e = _$setProp7(_el$, "borderColor", _v$, _p$.e));
      _v$2 !== _p$.t && (_p$.t = _$setProp7(_el$2, "marginBottom", _v$2, _p$.t));
      _v$3 !== _p$.a && (_p$.a = _$setProp7(_el$4, "color", _v$3, _p$.a));
      _v$4 !== _p$.o && (_p$.o = _$setProp7(_el$6, "color", _v$4, _p$.o));
      _v$5 !== _p$.i && (_p$.i = _$setProp7(_el$8, "color", _v$5, _p$.i));
      _v$6 !== _p$.n && (_p$.n = _$setProp7(_el$1, "color", _v$6, _p$.n));
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0,
      o: void 0,
      i: void 0,
      n: void 0
    });
    return _el$;
  })();
}
__name(ReasoningPart, "ReasoningPart");

// src/tui/component/message/assistant-message.tsx
function AssistantMessage(props) {
  const {
    theme
  } = useTheme();
  const isToolOutput = createMemo7(() => {
    return !!props.output.toolName;
  });
  const isReasoningOutput = createMemo7(() => {
    return props.output.result?.includes("<thinking>");
  });
  const content = createMemo7(() => props.output.displayedResult || props.output.result);
  return (() => {
    var _el$ = _$createElement8("box"), _el$2 = _$createElement8("box"), _el$3 = _$createElement8("text"), _el$7 = _$createElement8("box");
    _$insertNode8(_el$, _el$2);
    _$insertNode8(_el$, _el$7);
    _$setProp8(_el$, "flexDirection", "column");
    _$insertNode8(_el$2, _el$3);
    _$setProp8(_el$2, "flexDirection", "row");
    _$setProp8(_el$2, "gap", 1);
    _$insertNode8(_el$3, _$createTextNode7(`Assistant`));
    _$setProp8(_el$3, "bold", true);
    _$insert8(_el$2, _$createComponent16(Show5, {
      get when() {
        return props.output.toolName;
      },
      get children() {
        var _el$5 = _$createElement8("text"), _el$6 = _$createTextNode7(` `);
        _$insertNode8(_el$5, _el$6);
        _$insert8(_el$5, () => theme().icons.arrow, _el$6);
        _$insert8(_el$5, () => props.output.toolName, null);
        _$effect7((_$p) => _$setProp8(_el$5, "color", theme().colors.muted, _$p));
        return _el$5;
      }
    }), null);
    _$setProp8(_el$7, "marginLeft", 2);
    _$setProp8(_el$7, "marginTop", 1);
    _$insert8(_el$7, _$createComponent16(Show5, {
      get when() {
        return isToolOutput();
      },
      get fallback() {
        return _$createComponent16(Show5, {
          get when() {
            return isReasoningOutput();
          },
          get fallback() {
            return _$createComponent16(TextPart, {
              get content() {
                return content();
              }
            });
          },
          get children() {
            return _$createComponent16(ReasoningPart, {
              get content() {
                return content();
              }
            });
          }
        });
      },
      get children() {
        return _$createComponent16(ToolPart, {
          get output() {
            return props.output;
          },
          get isExpanded() {
            return props.isExpanded || false;
          }
        });
      }
    }));
    _$effect7((_$p) => _$setProp8(_el$3, "color", theme().colors.primary, _$p));
    return _el$;
  })();
}
__name(AssistantMessage, "AssistantMessage");

// src/tui/routes/session/messages.tsx
function Messages(props) {
  const {
    theme
  } = useTheme();
  const {
    state
  } = useSync();
  const groupedOutputs = createMemo8(() => {
    return state.outputs.map((output) => ({
      ...output,
      isExpanded: props.expandedOutputId === output.id
    }));
  });
  return (() => {
    var _el$ = _$createElement9("box");
    _$setProp9(_el$, "flexDirection", "column");
    _$setProp9(_el$, "padding", 1);
    _$insert9(_el$, _$createComponent17(Show6, {
      get when() {
        return state.outputs.length === 0;
      },
      get children() {
        var _el$2 = _$createElement9("box"), _el$3 = _$createElement9("text"), _el$5 = _$createElement9("text"), _el$7 = _$createElement9("box"), _el$8 = _$createElement9("text");
        _$insertNode9(_el$2, _el$3);
        _$insertNode9(_el$2, _el$5);
        _$insertNode9(_el$2, _el$7);
        _$setProp9(_el$2, "flexDirection", "column");
        _$setProp9(_el$2, "alignItems", "center");
        _$setProp9(_el$2, "marginY", 2);
        _$insertNode9(_el$3, _$createTextNode8(`Welcome to CodeCLI`));
        _$setProp9(_el$3, "bold", true);
        _$insertNode9(_el$5, _$createTextNode8(`Start typing to begin a conversation`));
        _$insertNode9(_el$7, _el$8);
        _$setProp9(_el$7, "marginTop", 1);
        _$insertNode9(_el$8, _$createTextNode8(`Use / for commands, @ for files, ! for shell`));
        _$effect8((_p$) => {
          var _v$ = theme().colors.primary, _v$2 = theme().colors.muted, _v$3 = theme().colors.muted;
          _v$ !== _p$.e && (_p$.e = _$setProp9(_el$3, "color", _v$, _p$.e));
          _v$2 !== _p$.t && (_p$.t = _$setProp9(_el$5, "color", _v$2, _p$.t));
          _v$3 !== _p$.a && (_p$.a = _$setProp9(_el$8, "color", _v$3, _p$.a));
          return _p$;
        }, {
          e: void 0,
          t: void 0,
          a: void 0
        });
        return _el$2;
      }
    }), null);
    _$insert9(_el$, _$createComponent17(For3, {
      get each() {
        return groupedOutputs();
      },
      children: /* @__PURE__ */ __name((output) => (() => {
        var _el$11 = _$createElement9("box");
        _$setProp9(_el$11, "marginBottom", 1);
        _$insert9(_el$11, _$createComponent17(AssistantMessage, {
          output,
          get isExpanded() {
            return output.isExpanded;
          }
        }));
        return _el$11;
      })(), "children")
    }), null);
    _$insert9(_el$, _$createComponent17(Show6, {
      get when() {
        return state.isProcessing;
      },
      get children() {
        var _el$0 = _$createElement9("box"), _el$1 = _$createElement9("text"), _el$10 = _$createTextNode8(` `);
        _$insertNode9(_el$0, _el$1);
        _$setProp9(_el$0, "marginTop", 1);
        _$insertNode9(_el$1, _el$10);
        _$insert9(_el$1, () => theme().icons.active, _el$10);
        _$insert9(_el$1, () => state.status.message || "Thinking...", null);
        _$effect8((_$p) => _$setProp9(_el$1, "color", theme().colors.primary, _$p));
        return _el$0;
      }
    }), null);
    return _el$;
  })();
}
__name(Messages, "Messages");

// src/tui/component/prompt/index.tsx
import { memo as _$memo8 } from "solid-js/web";
import { effect as _$effect10 } from "solid-js/web";
import { createTextNode as _$createTextNode10 } from "solid-js/web";
import { insertNode as _$insertNode11 } from "solid-js/web";
import { insert as _$insert11 } from "solid-js/web";
import { createComponent as _$createComponent19 } from "solid-js/web";
import { setProp as _$setProp11 } from "solid-js/web";
import { createElement as _$createElement11 } from "solid-js/web";
import { Show as Show7, createSignal as createSignal13, createMemo as createMemo10 } from "solid-js";

// src/tui/component/prompt/autocomplete.tsx
import { effect as _$effect9 } from "solid-js/web";
import { createTextNode as _$createTextNode9 } from "solid-js/web";
import { insertNode as _$insertNode10 } from "solid-js/web";
import { insert as _$insert10 } from "solid-js/web";
import { createComponent as _$createComponent18 } from "solid-js/web";
import { setProp as _$setProp10 } from "solid-js/web";
import { createElement as _$createElement10 } from "solid-js/web";
import { For as For4, createMemo as createMemo9, createSignal as createSignal12 } from "solid-js";
var COMMANDS = [{
  name: "plan",
  description: "Enter planning mode"
}, {
  name: "lsp",
  description: "Toggle LSP diagnostics"
}, {
  name: "agents",
  description: "Toggle sub-agents"
}, {
  name: "clear",
  description: "Clear conversation"
}, {
  name: "help",
  description: "Show help"
}, {
  name: "exit",
  description: "Exit application"
}, {
  name: "model",
  description: "Switch model"
}, {
  name: "session",
  description: "Session management"
}, {
  name: "theme",
  description: "Change theme"
}];
function Autocomplete(props) {
  const {
    theme
  } = useTheme();
  const [selectedIndex, setSelectedIndex] = createSignal12(0);
  const filteredCommands = createMemo9(() => {
    const query = props.query.toLowerCase();
    if (!query) return COMMANDS;
    return COMMANDS.filter((cmd) => cmd.name.toLowerCase().includes(query) || cmd.description.toLowerCase().includes(query));
  });
  createMemo9(() => {
    if (selectedIndex() >= filteredCommands().length) {
      setSelectedIndex(0);
    }
  });
  const handleSelect = /* @__PURE__ */ __name(() => {
    const selected = filteredCommands()[selectedIndex()];
    if (selected) {
      props.onSelect(selected.name);
    }
  }, "handleSelect");
  return (() => {
    var _el$ = _$createElement10("box"), _el$2 = _$createElement10("box"), _el$3 = _$createElement10("text"), _el$4 = _$createTextNode9(` Tab to select | Esc to close`);
    _$insertNode10(_el$, _el$2);
    _$setProp10(_el$, "flexDirection", "column");
    _$setProp10(_el$, "borderStyle", "single");
    _$setProp10(_el$, "marginBottom", 1);
    _$setProp10(_el$, "maxHeight", 10);
    _$insert10(_el$, _$createComponent18(For4, {
      get each() {
        return filteredCommands();
      },
      children: /* @__PURE__ */ __name((cmd, index) => (() => {
        var _el$5 = _$createElement10("box"), _el$6 = _$createElement10("text"), _el$7 = _$createTextNode9(`/`), _el$8 = _$createElement10("text"), _el$9 = _$createTextNode9(` - `);
        _$insertNode10(_el$5, _el$6);
        _$insertNode10(_el$5, _el$8);
        _$setProp10(_el$5, "paddingX", 1);
        _$insertNode10(_el$6, _el$7);
        _$insert10(_el$6, () => cmd.name, null);
        _$insertNode10(_el$8, _el$9);
        _$insert10(_el$8, () => cmd.description, null);
        _$effect9((_p$) => {
          var _v$4 = index() === selectedIndex() ? theme().colors.accent : void 0, _v$5 = index() === selectedIndex() ? theme().colors.background : theme().colors.foreground, _v$6 = index() === selectedIndex(), _v$7 = index() === selectedIndex() ? theme().colors.background : theme().colors.muted;
          _v$4 !== _p$.e && (_p$.e = _$setProp10(_el$5, "backgroundColor", _v$4, _p$.e));
          _v$5 !== _p$.t && (_p$.t = _$setProp10(_el$6, "color", _v$5, _p$.t));
          _v$6 !== _p$.a && (_p$.a = _$setProp10(_el$6, "bold", _v$6, _p$.a));
          _v$7 !== _p$.o && (_p$.o = _$setProp10(_el$8, "color", _v$7, _p$.o));
          return _p$;
        }, {
          e: void 0,
          t: void 0,
          a: void 0,
          o: void 0
        });
        return _el$5;
      })(), "children")
    }), _el$2);
    _$insertNode10(_el$2, _el$3);
    _$setProp10(_el$2, "paddingX", 1);
    _$setProp10(_el$2, "borderTop", true);
    _$insertNode10(_el$3, _el$4);
    _$insert10(_el$3, () => theme().icons.arrow, _el$4);
    _$effect9((_p$) => {
      var _v$ = theme().colors.accent, _v$2 = theme().colors.border, _v$3 = theme().colors.muted;
      _v$ !== _p$.e && (_p$.e = _$setProp10(_el$, "borderColor", _v$, _p$.e));
      _v$2 !== _p$.t && (_p$.t = _$setProp10(_el$2, "borderColor", _v$2, _p$.t));
      _v$3 !== _p$.a && (_p$.a = _$setProp10(_el$3, "color", _v$3, _p$.a));
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0
    });
    return _el$;
  })();
}
__name(Autocomplete, "Autocomplete");

// src/tui/component/prompt/index.tsx
function Prompt(props) {
  const {
    theme
  } = useTheme();
  const {
    value,
    setValue,
    mode,
    addToHistory,
    navigateHistory,
    clear
  } = usePrompt();
  const {
    state
  } = useSync();
  const [showAutocomplete, setShowAutocomplete] = createSignal13(false);
  const [isSubmitting, setIsSubmitting] = createSignal13(false);
  const borderColor = createMemo10(() => {
    switch (mode()) {
      case "command":
        return theme().colors.accent;
      case "file":
        return theme().colors.info;
      case "shell":
        return theme().colors.warning;
      default:
        return theme().colors.border;
    }
  });
  const modeIcon = createMemo10(() => {
    switch (mode()) {
      case "command":
        return theme().icons.command;
      case "file":
        return theme().icons.file;
      case "shell":
        return theme().icons.shell;
      default:
        return theme().icons.arrow;
    }
  });
  const handleChange = /* @__PURE__ */ __name((newValue) => {
    setValue(newValue);
    if (newValue.startsWith("/") && newValue.length > 1) {
      setShowAutocomplete(true);
    } else {
      setShowAutocomplete(false);
    }
  }, "handleChange");
  const handleSubmit = /* @__PURE__ */ __name(async () => {
    const currentValue = value();
    if (!currentValue.trim() || isSubmitting()) return;
    setIsSubmitting(true);
    setShowAutocomplete(false);
    try {
      await props.onSubmit(currentValue);
    } finally {
      setIsSubmitting(false);
    }
  }, "handleSubmit");
  const handleKeyDown = /* @__PURE__ */ __name((key, ctrl) => {
    if (key === "Enter" && !ctrl) {
      handleSubmit();
    } else if (key === "ArrowUp") {
      navigateHistory("up");
    } else if (key === "ArrowDown") {
      navigateHistory("down");
    } else if (key === "Escape") {
      setShowAutocomplete(false);
      if (value()) {
        clear();
      }
    } else if (key === "Tab" && showAutocomplete()) {
    }
  }, "handleKeyDown");
  return (() => {
    var _el$ = _$createElement11("box"), _el$2 = _$createElement11("box"), _el$3 = _$createElement11("text"), _el$4 = _$createTextNode10(` `), _el$5 = _$createElement11("input");
    _$insertNode11(_el$, _el$2);
    _$setProp11(_el$, "flexDirection", "column");
    _$insert11(_el$, _$createComponent19(Show7, {
      get when() {
        return showAutocomplete();
      },
      get children() {
        return _$createComponent19(Autocomplete, {
          get query() {
            return value().slice(1);
          },
          onSelect: /* @__PURE__ */ __name((cmd) => {
            setValue(`/${cmd} `);
            setShowAutocomplete(false);
          }, "onSelect"),
          onClose: /* @__PURE__ */ __name(() => setShowAutocomplete(false), "onClose")
        });
      }
    }), _el$2);
    _$insertNode11(_el$2, _el$3);
    _$insertNode11(_el$2, _el$5);
    _$setProp11(_el$2, "borderStyle", "single");
    _$setProp11(_el$2, "paddingX", 1);
    _$setProp11(_el$2, "flexDirection", "row");
    _$insertNode11(_el$3, _el$4);
    _$setProp11(_el$3, "bold", true);
    _$insert11(_el$3, modeIcon, _el$4);
    _$setProp11(_el$5, "onChange", (e) => handleChange(e.target.value));
    _$setProp11(_el$5, "onKeyDown", (e) => handleKeyDown(e.key, e.ctrlKey));
    _$setProp11(_el$5, "focus", true);
    _$setProp11(_el$5, "flexGrow", 1);
    _$insert11(_el$2, _$createComponent19(Show7, {
      get when() {
        return value().trim();
      },
      get children() {
        var _el$6 = _$createElement11("text");
        _$insertNode11(_el$6, _$createTextNode10(` [Enter]`));
        _$effect10((_$p) => _$setProp11(_el$6, "color", theme().colors.muted, _$p));
        return _el$6;
      }
    }), null);
    _$insert11(_el$, _$createComponent19(Show7, {
      get when() {
        return _$memo8(() => !!!value())() && !state.isProcessing;
      },
      get children() {
        var _el$8 = _$createElement11("box"), _el$9 = _$createElement11("text"), _el$0 = _$createTextNode10(` command | `), _el$1 = _$createTextNode10(` file | `), _el$10 = _$createTextNode10(` shell`);
        _$insertNode11(_el$8, _el$9);
        _$setProp11(_el$8, "marginTop", 1);
        _$insertNode11(_el$9, _el$0);
        _$insertNode11(_el$9, _el$1);
        _$insertNode11(_el$9, _el$10);
        _$insert11(_el$9, () => theme().icons.command, _el$0);
        _$insert11(_el$9, () => theme().icons.file, _el$1);
        _$insert11(_el$9, () => theme().icons.shell, _el$10);
        _$effect10((_$p) => _$setProp11(_el$9, "color", theme().colors.muted, _$p));
        return _el$8;
      }
    }), null);
    _$effect10((_p$) => {
      var _v$ = borderColor(), _v$2 = borderColor(), _v$3 = value(), _v$4 = state.isProcessing ? "Processing..." : mode() === "command" ? "Type a command..." : mode() === "file" ? "Enter file path..." : mode() === "shell" ? "Enter shell command..." : "Type a message...", _v$5 = isSubmitting();
      _v$ !== _p$.e && (_p$.e = _$setProp11(_el$2, "borderColor", _v$, _p$.e));
      _v$2 !== _p$.t && (_p$.t = _$setProp11(_el$3, "color", _v$2, _p$.t));
      _v$3 !== _p$.a && (_p$.a = _$setProp11(_el$5, "value", _v$3, _p$.a));
      _v$4 !== _p$.o && (_p$.o = _$setProp11(_el$5, "placeholder", _v$4, _p$.o));
      _v$5 !== _p$.i && (_p$.i = _$setProp11(_el$5, "disabled", _v$5, _p$.i));
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0,
      o: void 0,
      i: void 0
    });
    return _el$;
  })();
}
__name(Prompt, "Prompt");

// src/tui/component/todo-item.tsx
import { memo as _$memo9 } from "solid-js/web";
import { effect as _$effect11 } from "solid-js/web";
import { createComponent as _$createComponent20 } from "solid-js/web";
import { insert as _$insert12 } from "solid-js/web";
import { createTextNode as _$createTextNode11 } from "solid-js/web";
import { insertNode as _$insertNode12 } from "solid-js/web";
import { setProp as _$setProp12 } from "solid-js/web";
import { createElement as _$createElement12 } from "solid-js/web";
import { For as For5, createMemo as createMemo11, createSignal as createSignal14, createEffect as createEffect3, onCleanup as onCleanup3 } from "solid-js";
function TodoList(props) {
  const {
    theme
  } = useTheme();
  const completedCount = createMemo11(() => props.todos.filter((t) => t.status === "completed").length);
  const progress = createMemo11(() => {
    if (props.todos.length === 0) return 0;
    return Math.round(completedCount() / props.todos.length * 100);
  });
  const spinnerFrames = ["\u25D0", "\u25D3", "\u25D1", "\u25D2"];
  const [spinnerIndex, setSpinnerIndex] = createSignal14(0);
  createEffect3(() => {
    const hasInProgress = props.todos.some((t) => t.status === "in_progress");
    if (hasInProgress) {
      const interval = setInterval(() => {
        setSpinnerIndex((i) => (i + 1) % spinnerFrames.length);
      }, 100);
      onCleanup3(() => clearInterval(interval));
    }
  });
  const getStatusIcon = /* @__PURE__ */ __name((status) => {
    switch (status) {
      case "completed":
        return {
          icon: theme().icons.completed,
          color: theme().colors.success
        };
      case "in_progress":
        return {
          icon: spinnerFrames[spinnerIndex()],
          color: theme().colors.warning
        };
      default:
        return {
          icon: theme().icons.pending,
          color: theme().colors.muted
        };
    }
  }, "getStatusIcon");
  return (() => {
    var _el$ = _$createElement12("box"), _el$2 = _$createElement12("box"), _el$3 = _$createElement12("text"), _el$5 = _$createElement12("text"), _el$6 = _$createTextNode11(`/`), _el$7 = _$createTextNode11(` (`), _el$8 = _$createTextNode11(`%)`), _el$9 = _$createElement12("box"), _el$0 = _$createElement12("text"), _el$10 = _$createElement12("text"), _el$11 = _$createElement12("text"), _el$12 = _$createElement12("text");
    _$insertNode12(_el$, _el$2);
    _$insertNode12(_el$, _el$9);
    _$setProp12(_el$, "flexDirection", "column");
    _$setProp12(_el$, "borderStyle", "single");
    _$setProp12(_el$, "marginY", 1);
    _$setProp12(_el$, "padding", 1);
    _$insertNode12(_el$2, _el$3);
    _$insertNode12(_el$2, _el$5);
    _$setProp12(_el$2, "flexDirection", "row");
    _$setProp12(_el$2, "justifyContent", "space-between");
    _$setProp12(_el$2, "marginBottom", 1);
    _$insertNode12(_el$3, _$createTextNode11(`Tasks`));
    _$setProp12(_el$3, "bold", true);
    _$insertNode12(_el$5, _el$6);
    _$insertNode12(_el$5, _el$7);
    _$insertNode12(_el$5, _el$8);
    _$insert12(_el$5, completedCount, _el$6);
    _$insert12(_el$5, () => props.todos.length, _el$7);
    _$insert12(_el$5, progress, _el$8);
    _$insertNode12(_el$9, _el$0);
    _$insertNode12(_el$9, _el$10);
    _$insertNode12(_el$9, _el$11);
    _$insertNode12(_el$9, _el$12);
    _$setProp12(_el$9, "marginBottom", 1);
    _$insertNode12(_el$0, _$createTextNode11(`[`));
    _$insert12(_el$10, () => "\u2588".repeat(Math.floor(progress() / 5)));
    _$insert12(_el$11, () => "\u2591".repeat(20 - Math.floor(progress() / 5)));
    _$insertNode12(_el$12, _$createTextNode11(`]`));
    _$insert12(_el$, _$createComponent20(For5, {
      get each() {
        return props.todos;
      },
      children: /* @__PURE__ */ __name((todo) => {
        const status = getStatusIcon(todo.status);
        return (() => {
          var _el$14 = _$createElement12("box"), _el$15 = _$createElement12("text"), _el$16 = _$createTextNode11(` `), _el$17 = _$createElement12("text");
          _$insertNode12(_el$14, _el$15);
          _$insertNode12(_el$14, _el$17);
          _$setProp12(_el$14, "flexDirection", "row");
          _$insertNode12(_el$15, _el$16);
          _$insert12(_el$15, () => status.icon, _el$16);
          _$setProp12(_el$17, "wrap", "truncate");
          _$insert12(_el$17, (() => {
            var _c$ = _$memo9(() => !!(todo.status === "in_progress" && todo.activeForm));
            return () => _c$() ? todo.activeForm : todo.content;
          })());
          _$effect11((_p$) => {
            var _v$7 = status.color, _v$8 = todo.status === "completed" ? theme().colors.muted : theme().colors.foreground, _v$9 = todo.status === "completed";
            _v$7 !== _p$.e && (_p$.e = _$setProp12(_el$15, "color", _v$7, _p$.e));
            _v$8 !== _p$.t && (_p$.t = _$setProp12(_el$17, "color", _v$8, _p$.t));
            _v$9 !== _p$.a && (_p$.a = _$setProp12(_el$17, "strikethrough", _v$9, _p$.a));
            return _p$;
          }, {
            e: void 0,
            t: void 0,
            a: void 0
          });
          return _el$14;
        })();
      }, "children")
    }), null);
    _$effect11((_p$) => {
      var _v$ = theme().colors.border, _v$2 = theme().colors.muted, _v$3 = theme().colors.muted, _v$4 = theme().colors.success, _v$5 = theme().colors.border, _v$6 = theme().colors.muted;
      _v$ !== _p$.e && (_p$.e = _$setProp12(_el$, "borderColor", _v$, _p$.e));
      _v$2 !== _p$.t && (_p$.t = _$setProp12(_el$5, "color", _v$2, _p$.t));
      _v$3 !== _p$.a && (_p$.a = _$setProp12(_el$0, "color", _v$3, _p$.a));
      _v$4 !== _p$.o && (_p$.o = _$setProp12(_el$10, "color", _v$4, _p$.o));
      _v$5 !== _p$.i && (_p$.i = _$setProp12(_el$11, "color", _v$5, _p$.i));
      _v$6 !== _p$.n && (_p$.n = _$setProp12(_el$12, "color", _v$6, _p$.n));
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0,
      o: void 0,
      i: void 0,
      n: void 0
    });
    return _el$;
  })();
}
__name(TodoList, "TodoList");

// src/tui/ui/dialog.tsx
import { memo as _$memo10 } from "solid-js/web";
import { createTextNode as _$createTextNode12 } from "solid-js/web";
import { effect as _$effect12 } from "solid-js/web";
import { insertNode as _$insertNode13 } from "solid-js/web";
import { insert as _$insert13 } from "solid-js/web";
import { setProp as _$setProp13 } from "solid-js/web";
import { createElement as _$createElement13 } from "solid-js/web";
import { createComponent as _$createComponent21 } from "solid-js/web";
import { Show as Show8, For as For6, createSignal as createSignal15, Switch, Match } from "solid-js";
function DialogContainer() {
  const {
    current,
    close
  } = useDialog();
  const {
    theme
  } = useTheme();
  return _$createComponent21(Show8, {
    get when() {
      return current();
    },
    children: /* @__PURE__ */ __name((config) => (() => {
      var _el$ = _$createElement13("box"), _el$2 = _$createElement13("box"), _el$3 = _$createElement13("box");
      _$insertNode13(_el$, _el$2);
      _$insertNode13(_el$, _el$3);
      _$setProp13(_el$, "position", "absolute");
      _$setProp13(_el$, "top", 0);
      _$setProp13(_el$, "left", 0);
      _$setProp13(_el$, "right", 0);
      _$setProp13(_el$, "bottom", 0);
      _$setProp13(_el$, "justifyContent", "center");
      _$setProp13(_el$, "alignItems", "center");
      _$setProp13(_el$2, "position", "absolute");
      _$setProp13(_el$2, "top", 0);
      _$setProp13(_el$2, "left", 0);
      _$setProp13(_el$2, "right", 0);
      _$setProp13(_el$2, "bottom", 0);
      _$setProp13(_el$2, "backgroundColor", "rgba(0,0,0,0.5)");
      _$setProp13(_el$3, "borderStyle", "double");
      _$setProp13(_el$3, "padding", 2);
      _$setProp13(_el$3, "minWidth", 40);
      _$setProp13(_el$3, "maxWidth", 60);
      _$setProp13(_el$3, "flexDirection", "column");
      _$insert13(_el$3, _$createComponent21(Switch, {
        get children() {
          return [_$createComponent21(Match, {
            get when() {
              return config().type === "confirm";
            },
            get children() {
              return _$createComponent21(ConfirmDialog, {
                get config() {
                  return config();
                }
              });
            }
          }), _$createComponent21(Match, {
            get when() {
              return config().type === "alert";
            },
            get children() {
              return _$createComponent21(AlertDialog, {
                get config() {
                  return config();
                }
              });
            }
          }), _$createComponent21(Match, {
            get when() {
              return config().type === "prompt";
            },
            get children() {
              return _$createComponent21(PromptDialog, {
                get config() {
                  return config();
                }
              });
            }
          }), _$createComponent21(Match, {
            get when() {
              return config().type === "select";
            },
            get children() {
              return _$createComponent21(SelectDialog, {
                get config() {
                  return config();
                }
              });
            }
          })];
        }
      }));
      _$effect12((_p$) => {
        var _v$ = theme().colors.primary, _v$2 = theme().colors.background;
        _v$ !== _p$.e && (_p$.e = _$setProp13(_el$3, "borderColor", _v$, _p$.e));
        _v$2 !== _p$.t && (_p$.t = _$setProp13(_el$3, "backgroundColor", _v$2, _p$.t));
        return _p$;
      }, {
        e: void 0,
        t: void 0
      });
      return _el$;
    })(), "children")
  });
}
__name(DialogContainer, "DialogContainer");
function ConfirmDialog(props) {
  const {
    theme
  } = useTheme();
  const [selected, setSelected] = createSignal15("yes");
  const handleConfirm = /* @__PURE__ */ __name(() => {
    if (selected() === "yes") {
      props.config.onConfirm?.();
    } else {
      props.config.onCancel?.();
    }
  }, "handleConfirm");
  return (() => {
    var _el$4 = _$createElement13("box"), _el$6 = _$createElement13("text"), _el$7 = _$createElement13("box"), _el$8 = _$createElement13("box"), _el$9 = _$createElement13("text"), _el$1 = _$createElement13("box"), _el$10 = _$createElement13("text"), _el$12 = _$createElement13("text");
    _$insertNode13(_el$4, _el$6);
    _$insertNode13(_el$4, _el$7);
    _$insertNode13(_el$4, _el$12);
    _$setProp13(_el$4, "flexDirection", "column");
    _$insert13(_el$4, _$createComponent21(Show8, {
      get when() {
        return props.config.title;
      },
      get children() {
        var _el$5 = _$createElement13("text");
        _$setProp13(_el$5, "bold", true);
        _$setProp13(_el$5, "marginBottom", 1);
        _$insert13(_el$5, () => props.config.title);
        return _el$5;
      }
    }), _el$6);
    _$setProp13(_el$6, "wrap", "wrap");
    _$setProp13(_el$6, "marginBottom", 2);
    _$insert13(_el$6, () => props.config.message);
    _$insertNode13(_el$7, _el$8);
    _$insertNode13(_el$7, _el$1);
    _$setProp13(_el$7, "flexDirection", "row");
    _$setProp13(_el$7, "gap", 2);
    _$setProp13(_el$7, "justifyContent", "center");
    _$insertNode13(_el$8, _el$9);
    _$setProp13(_el$8, "borderStyle", "single");
    _$setProp13(_el$8, "paddingX", 2);
    _$insertNode13(_el$9, _$createTextNode12(`Yes (y)`));
    _$insertNode13(_el$1, _el$10);
    _$setProp13(_el$1, "borderStyle", "single");
    _$setProp13(_el$1, "paddingX", 2);
    _$insertNode13(_el$10, _$createTextNode12(`No (n)`));
    _$insertNode13(_el$12, _$createTextNode12(`Arrow keys to select, Enter to confirm`));
    _$setProp13(_el$12, "marginTop", 1);
    _$setProp13(_el$12, "textAlign", "center");
    _$effect12((_p$) => {
      var _v$3 = selected() === "yes" ? theme().colors.success : theme().colors.border, _v$4 = selected() === "yes", _v$5 = selected() === "yes" ? theme().colors.success : void 0, _v$6 = selected() === "no" ? theme().colors.error : theme().colors.border, _v$7 = selected() === "no", _v$8 = selected() === "no" ? theme().colors.error : void 0, _v$9 = theme().colors.muted;
      _v$3 !== _p$.e && (_p$.e = _$setProp13(_el$8, "borderColor", _v$3, _p$.e));
      _v$4 !== _p$.t && (_p$.t = _$setProp13(_el$9, "bold", _v$4, _p$.t));
      _v$5 !== _p$.a && (_p$.a = _$setProp13(_el$9, "color", _v$5, _p$.a));
      _v$6 !== _p$.o && (_p$.o = _$setProp13(_el$1, "borderColor", _v$6, _p$.o));
      _v$7 !== _p$.i && (_p$.i = _$setProp13(_el$10, "bold", _v$7, _p$.i));
      _v$8 !== _p$.n && (_p$.n = _$setProp13(_el$10, "color", _v$8, _p$.n));
      _v$9 !== _p$.s && (_p$.s = _$setProp13(_el$12, "color", _v$9, _p$.s));
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0,
      o: void 0,
      i: void 0,
      n: void 0,
      s: void 0
    });
    return _el$4;
  })();
}
__name(ConfirmDialog, "ConfirmDialog");
function AlertDialog(props) {
  const {
    theme
  } = useTheme();
  return (() => {
    var _el$14 = _$createElement13("box"), _el$16 = _$createElement13("text"), _el$17 = _$createElement13("box"), _el$18 = _$createElement13("box"), _el$19 = _$createElement13("text");
    _$insertNode13(_el$14, _el$16);
    _$insertNode13(_el$14, _el$17);
    _$setProp13(_el$14, "flexDirection", "column");
    _$insert13(_el$14, _$createComponent21(Show8, {
      get when() {
        return props.config.title;
      },
      get children() {
        var _el$15 = _$createElement13("text");
        _$setProp13(_el$15, "bold", true);
        _$setProp13(_el$15, "marginBottom", 1);
        _$insert13(_el$15, () => props.config.title);
        return _el$15;
      }
    }), _el$16);
    _$setProp13(_el$16, "wrap", "wrap");
    _$setProp13(_el$16, "marginBottom", 2);
    _$insert13(_el$16, () => props.config.message);
    _$insertNode13(_el$17, _el$18);
    _$setProp13(_el$17, "flexDirection", "row");
    _$setProp13(_el$17, "justifyContent", "center");
    _$insertNode13(_el$18, _el$19);
    _$setProp13(_el$18, "borderStyle", "single");
    _$setProp13(_el$18, "paddingX", 3);
    _$insertNode13(_el$19, _$createTextNode12(`OK (Enter)`));
    _$setProp13(_el$19, "bold", true);
    _$effect12((_p$) => {
      var _v$0 = theme().colors.primary, _v$1 = theme().colors.primary;
      _v$0 !== _p$.e && (_p$.e = _$setProp13(_el$18, "borderColor", _v$0, _p$.e));
      _v$1 !== _p$.t && (_p$.t = _$setProp13(_el$19, "color", _v$1, _p$.t));
      return _p$;
    }, {
      e: void 0,
      t: void 0
    });
    return _el$14;
  })();
}
__name(AlertDialog, "AlertDialog");
function PromptDialog(props) {
  const {
    theme
  } = useTheme();
  const [value, setValue] = createSignal15(props.config.defaultValue || "");
  const handleSubmit = /* @__PURE__ */ __name(() => {
    props.config.onConfirm?.(value());
  }, "handleSubmit");
  return (() => {
    var _el$21 = _$createElement13("box"), _el$23 = _$createElement13("text"), _el$24 = _$createElement13("box"), _el$25 = _$createElement13("input"), _el$26 = _$createElement13("text");
    _$insertNode13(_el$21, _el$23);
    _$insertNode13(_el$21, _el$24);
    _$insertNode13(_el$21, _el$26);
    _$setProp13(_el$21, "flexDirection", "column");
    _$insert13(_el$21, _$createComponent21(Show8, {
      get when() {
        return props.config.title;
      },
      get children() {
        var _el$22 = _$createElement13("text");
        _$setProp13(_el$22, "bold", true);
        _$setProp13(_el$22, "marginBottom", 1);
        _$insert13(_el$22, () => props.config.title);
        return _el$22;
      }
    }), _el$23);
    _$setProp13(_el$23, "wrap", "wrap");
    _$setProp13(_el$23, "marginBottom", 1);
    _$insert13(_el$23, () => props.config.message);
    _$insertNode13(_el$24, _el$25);
    _$setProp13(_el$24, "borderStyle", "single");
    _$setProp13(_el$24, "padding", 1);
    _$setProp13(_el$25, "onChange", (e) => setValue(e.target.value));
    _$setProp13(_el$25, "focus", true);
    _$setProp13(_el$25, "flexGrow", 1);
    _$insertNode13(_el$26, _$createTextNode12(`Enter to submit, Esc to cancel`));
    _$setProp13(_el$26, "marginTop", 1);
    _$effect12((_p$) => {
      var _v$10 = theme().colors.primary, _v$11 = value(), _v$12 = theme().colors.muted;
      _v$10 !== _p$.e && (_p$.e = _$setProp13(_el$24, "borderColor", _v$10, _p$.e));
      _v$11 !== _p$.t && (_p$.t = _$setProp13(_el$25, "value", _v$11, _p$.t));
      _v$12 !== _p$.a && (_p$.a = _$setProp13(_el$26, "color", _v$12, _p$.a));
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0
    });
    return _el$21;
  })();
}
__name(PromptDialog, "PromptDialog");
function SelectDialog(props) {
  const {
    theme
  } = useTheme();
  const [selectedIndex, setSelectedIndex] = createSignal15(0);
  const options = /* @__PURE__ */ __name(() => props.config.options || [], "options");
  const handleSelect = /* @__PURE__ */ __name(() => {
    const option = options()[selectedIndex()];
    if (option) {
      props.config.onConfirm?.(option.value);
    }
  }, "handleSelect");
  return (() => {
    var _el$28 = _$createElement13("box"), _el$31 = _$createElement13("box"), _el$32 = _$createElement13("text");
    _$insertNode13(_el$28, _el$31);
    _$insertNode13(_el$28, _el$32);
    _$setProp13(_el$28, "flexDirection", "column");
    _$insert13(_el$28, _$createComponent21(Show8, {
      get when() {
        return props.config.title;
      },
      get children() {
        var _el$29 = _$createElement13("text");
        _$setProp13(_el$29, "bold", true);
        _$setProp13(_el$29, "marginBottom", 1);
        _$insert13(_el$29, () => props.config.title);
        return _el$29;
      }
    }), _el$31);
    _$insert13(_el$28, _$createComponent21(Show8, {
      get when() {
        return props.config.message;
      },
      get children() {
        var _el$30 = _$createElement13("text");
        _$setProp13(_el$30, "wrap", "wrap");
        _$setProp13(_el$30, "marginBottom", 1);
        _$insert13(_el$30, () => props.config.message);
        return _el$30;
      }
    }), _el$31);
    _$setProp13(_el$31, "flexDirection", "column");
    _$setProp13(_el$31, "marginY", 1);
    _$insert13(_el$31, _$createComponent21(For6, {
      get each() {
        return options();
      },
      children: /* @__PURE__ */ __name((option, index) => (() => {
        var _el$34 = _$createElement13("box"), _el$35 = _$createElement13("text"), _el$36 = _$createTextNode12(` `);
        _$insertNode13(_el$34, _el$35);
        _$setProp13(_el$34, "paddingX", 1);
        _$insertNode13(_el$35, _el$36);
        _$insert13(_el$35, (() => {
          var _c$ = _$memo10(() => index() === selectedIndex());
          return () => _c$() ? theme().icons.arrow : " ";
        })(), _el$36);
        _$insert13(_el$35, () => option.label, null);
        _$effect12((_p$) => {
          var _v$13 = index() === selectedIndex() ? theme().colors.accent : void 0, _v$14 = index() === selectedIndex() ? theme().colors.background : theme().colors.foreground, _v$15 = index() === selectedIndex();
          _v$13 !== _p$.e && (_p$.e = _$setProp13(_el$34, "backgroundColor", _v$13, _p$.e));
          _v$14 !== _p$.t && (_p$.t = _$setProp13(_el$35, "color", _v$14, _p$.t));
          _v$15 !== _p$.a && (_p$.a = _$setProp13(_el$35, "bold", _v$15, _p$.a));
          return _p$;
        }, {
          e: void 0,
          t: void 0,
          a: void 0
        });
        return _el$34;
      })(), "children")
    }));
    _$insertNode13(_el$32, _$createTextNode12(`Arrow keys to navigate, Enter to select, Esc to cancel`));
    _$effect12((_$p) => _$setProp13(_el$32, "color", theme().colors.muted, _$p));
    return _el$28;
  })();
}
__name(SelectDialog, "SelectDialog");

// src/tui/ui/toast.tsx
import { createTextNode as _$createTextNode13 } from "solid-js/web";
import { effect as _$effect13 } from "solid-js/web";
import { insertNode as _$insertNode14 } from "solid-js/web";
import { insert as _$insert14 } from "solid-js/web";
import { createComponent as _$createComponent22 } from "solid-js/web";
import { setProp as _$setProp14 } from "solid-js/web";
import { createElement as _$createElement14 } from "solid-js/web";
import { For as For7, Show as Show9, createMemo as createMemo12 } from "solid-js";
function ToastContainer() {
  const {
    toasts
  } = useToast();
  const {
    theme
  } = useTheme();
  return _$createComponent22(Show9, {
    get when() {
      return toasts().length > 0;
    },
    get children() {
      var _el$ = _$createElement14("box");
      _$setProp14(_el$, "position", "absolute");
      _$setProp14(_el$, "bottom", 2);
      _$setProp14(_el$, "right", 2);
      _$setProp14(_el$, "flexDirection", "column");
      _$setProp14(_el$, "gap", 1);
      _$insert14(_el$, _$createComponent22(For7, {
        get each() {
          return toasts();
        },
        children: /* @__PURE__ */ __name((toast) => _$createComponent22(ToastItem, {
          toast
        }), "children")
      }));
      return _el$;
    }
  });
}
__name(ToastContainer, "ToastContainer");
function ToastItem(props) {
  const {
    theme
  } = useTheme();
  const {
    dismiss
  } = useToast();
  const getToastStyle = /* @__PURE__ */ __name((type) => {
    switch (type) {
      case "success":
        return {
          icon: theme().icons.success,
          color: theme().colors.success,
          borderColor: theme().colors.success
        };
      case "error":
        return {
          icon: theme().icons.error,
          color: theme().colors.error,
          borderColor: theme().colors.error
        };
      case "warning":
        return {
          icon: theme().icons.warning,
          color: theme().colors.warning,
          borderColor: theme().colors.warning
        };
      default:
        return {
          icon: theme().icons.info,
          color: theme().colors.info,
          borderColor: theme().colors.info
        };
    }
  }, "getToastStyle");
  const style = createMemo12(() => getToastStyle(props.toast.type));
  return (() => {
    var _el$2 = _$createElement14("box"), _el$3 = _$createElement14("box"), _el$4 = _$createElement14("text"), _el$5 = _$createElement14("text");
    _$insertNode14(_el$2, _el$3);
    _$setProp14(_el$2, "borderStyle", "single");
    _$setProp14(_el$2, "paddingX", 2);
    _$setProp14(_el$2, "paddingY", 1);
    _$setProp14(_el$2, "minWidth", 30);
    _$setProp14(_el$2, "maxWidth", 50);
    _$insertNode14(_el$3, _el$4);
    _$insertNode14(_el$3, _el$5);
    _$setProp14(_el$3, "flexDirection", "row");
    _$setProp14(_el$3, "gap", 1);
    _$insert14(_el$4, () => style().icon);
    _$setProp14(_el$5, "wrap", "wrap");
    _$insert14(_el$5, () => props.toast.message);
    _$insert14(_el$2, _$createComponent22(Show9, {
      get when() {
        return props.toast.action;
      },
      children: /* @__PURE__ */ __name((action) => (() => {
        var _el$6 = _$createElement14("box"), _el$7 = _$createElement14("text"), _el$8 = _$createTextNode13(`[`), _el$9 = _$createTextNode13(`]`);
        _$insertNode14(_el$6, _el$7);
        _$setProp14(_el$6, "marginTop", 1);
        _$insertNode14(_el$7, _el$8);
        _$insertNode14(_el$7, _el$9);
        _$setProp14(_el$7, "bold", true);
        _$insert14(_el$7, () => action().label, _el$9);
        _$effect13((_$p) => _$setProp14(_el$7, "color", theme().colors.accent, _$p));
        return _el$6;
      })(), "children")
    }), null);
    _$effect13((_p$) => {
      var _v$ = style().borderColor, _v$2 = theme().colors.background, _v$3 = style().color;
      _v$ !== _p$.e && (_p$.e = _$setProp14(_el$2, "borderColor", _v$, _p$.e));
      _v$2 !== _p$.t && (_p$.t = _$setProp14(_el$2, "backgroundColor", _v$2, _p$.t));
      _v$3 !== _p$.a && (_p$.a = _$setProp14(_el$4, "color", _v$3, _p$.a));
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0
    });
    return _el$2;
  })();
}
__name(ToastItem, "ToastItem");

// src/tui/routes/session/index.tsx
function Session() {
  const {
    theme
  } = useTheme();
  const {
    state
  } = useSync();
  const {
    processInput
  } = useAgent();
  const prompt = usePrompt();
  const dialog = useDialog();
  const {
    match
  } = useKeybind();
  const {
    exit
  } = useExit();
  const [showSidebar, setShowSidebar] = createSignal16(true);
  const [expandedOutputId, setExpandedOutputId] = createSignal16(null);
  createEffect4(() => {
    const handleKeypress = /* @__PURE__ */ __name((key, ctrl, alt, shift) => {
      const action = match({
        key,
        ctrl,
        alt,
        shift
      });
      if (action) {
        switch (action) {
          case "exit":
            exit();
            break;
          case "output.expand":
            const outputs = state.outputs;
            if (outputs.length > 0) {
              const lastId = outputs[outputs.length - 1].id;
              setExpandedOutputId((current) => current === lastId ? null : lastId);
            }
            break;
          case "theme.toggle":
            break;
          case "command.open":
            break;
        }
      }
    }, "handleKeypress");
    onCleanup4(() => {
    });
  });
  const handleSubmit = /* @__PURE__ */ __name(async (input) => {
    if (!input.trim()) return;
    prompt.addToHistory(input);
    prompt.clear();
    try {
      await processInput(input);
    } catch (error) {
      console.error("Error processing input:", error);
    }
  }, "handleSubmit");
  return (() => {
    var _el$ = _$createElement15("box"), _el$2 = _$createElement15("box"), _el$3 = _$createElement15("box"), _el$4 = _$createElement15("box");
    _$insertNode15(_el$, _el$2);
    _$setProp15(_el$, "flexDirection", "column");
    _$setProp15(_el$, "height", "100%");
    _$insert15(_el$, _$createComponent23(Header, {}), _el$2);
    _$insertNode15(_el$2, _el$3);
    _$setProp15(_el$2, "flexDirection", "row");
    _$setProp15(_el$2, "flexGrow", 1);
    _$insertNode15(_el$3, _el$4);
    _$setProp15(_el$3, "flexDirection", "column");
    _$setProp15(_el$3, "flexGrow", 1);
    _$setProp15(_el$4, "flexGrow", 1);
    _$setProp15(_el$4, "overflow", "scroll");
    _$insert15(_el$4, _$createComponent23(Messages, {
      get expandedOutputId() {
        return expandedOutputId();
      }
    }));
    _$insert15(_el$3, _$createComponent23(Show10, {
      get when() {
        return state.todos.length > 0;
      },
      get children() {
        return _$createComponent23(TodoList, {
          get todos() {
            return state.todos;
          }
        });
      }
    }), null);
    _$insert15(_el$3, _$createComponent23(Prompt, {
      onSubmit: handleSubmit
    }), null);
    _$insert15(_el$2, _$createComponent23(Show10, {
      get when() {
        return showSidebar();
      },
      get children() {
        return _$createComponent23(Sidebar, {});
      }
    }), null);
    _$insert15(_el$, _$createComponent23(Footer, {}), null);
    _$insert15(_el$, _$createComponent23(Show10, {
      get when() {
        return dialog.isOpen();
      },
      get children() {
        return _$createComponent23(DialogContainer, {});
      }
    }), null);
    _$insert15(_el$, _$createComponent23(ToastContainer, {}), null);
    return _el$;
  })();
}
__name(Session, "Session");

// src/tui/app.tsx
function Providers(props) {
  return _$createComponent24(ExitProvider, {
    get children() {
      return _$createComponent24(KeybindProvider, {
        get children() {
          return _$createComponent24(ThemeProvider, {
            get isDarkMode() {
              return props.isDarkMode;
            },
            get children() {
              return _$createComponent24(AgentProvider, {
                get agent() {
                  return props.agent;
                },
                get children() {
                  return _$createComponent24(SyncProvider, {
                    get children() {
                      return _$createComponent24(RouteProvider, {
                        get children() {
                          return _$createComponent24(DialogProvider, {
                            get children() {
                              return _$createComponent24(CommandProvider, {
                                get children() {
                                  return _$createComponent24(PromptProvider, {
                                    get children() {
                                      return _$createComponent24(ToastProvider, {
                                        get children() {
                                          return props.children;
                                        }
                                      });
                                    }
                                  });
                                }
                              });
                            }
                          });
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
  });
}
__name(Providers, "Providers");
function Router() {
  const route = useRoute();
  return _$createComponent24(Show11, {
    get when() {
      return route.current() === "session";
    },
    get fallback() {
      return _$createComponent24(Home, {});
    },
    get children() {
      return _$createComponent24(Session, {});
    }
  });
}
__name(Router, "Router");
function App(props) {
  return _$createComponent24(Providers, {
    get agent() {
      return props.agent;
    },
    get isDarkMode() {
      return props.isDarkMode;
    },
    get children() {
      return _$createComponent24(Router, {});
    }
  });
}
__name(App, "App");

// src/tui/entry.ts
async function startTUI(options) {
  const { agent, onExit } = options;
  const isDarkMode = await detectTerminalBackground();
  const instance = render(() => App({ agent, isDarkMode }), {
    fps: 60,
    // Enable Kitty keyboard protocol for better key handling
    kittyKeyboard: true,
    // Use Ctrl+Y for clipboard operations
    clipboard: { key: "ctrl+y" }
  });
  if (onExit && instance.unmount) {
    const originalUnmount = instance.unmount;
    instance.unmount = () => {
      originalUnmount();
      onExit();
    };
  }
  if (instance.waitUntilExit) {
    await instance.waitUntilExit();
  }
}
__name(startTUI, "startTUI");
async function detectTerminalBackground() {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(true), 100);
    const originalRawMode = process.stdin.isRaw;
    try {
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
        process.stdin.resume();
        const handler = /* @__PURE__ */ __name((data) => {
          clearTimeout(timeout);
          process.stdin.removeListener("data", handler);
          if (originalRawMode !== void 0) {
            process.stdin.setRawMode(originalRawMode);
          }
          const response = data.toString();
          const match = response.match(/rgb:([0-9a-f]+)\/([0-9a-f]+)\/([0-9a-f]+)/i);
          if (match) {
            const r = parseInt(match[1].slice(0, 2), 16);
            const g = parseInt(match[2].slice(0, 2), 16);
            const b = parseInt(match[3].slice(0, 2), 16);
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            resolve(luminance < 0.5);
          } else {
            resolve(true);
          }
        }, "handler");
        process.stdin.on("data", handler);
        process.stdout.write("\x1B]11;?\x1B\\");
      } else {
        resolve(true);
      }
    } catch {
      resolve(true);
    }
  });
}
__name(detectTerminalBackground, "detectTerminalBackground");
export {
  startTUI
};
//# sourceMappingURL=entry.js.map
