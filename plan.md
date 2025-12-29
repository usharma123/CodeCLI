# TUI Overhaul Plan: Migrate to SolidJS + OpenTUI

## Status: Phase 1 Implementation Complete

The foundation has been implemented.

### To Test

**Option 1: Build and run separately**
```bash
bun run build:tui       # Compile SolidJS components
bun run dev --experimental-tui
```

**Option 2: Build and run in one command**
```bash
bun run dev:tui
```

### Note on JSX Compilation
SolidJS requires compilation with `babel-preset-solid`. The `build:tui` script uses esbuild with `esbuild-plugin-solid` to compile the TUI components. The compiled output is in `dist/tui/`.

## Overview

Full rewrite of the terminal UI from React/Ink to SolidJS/OpenTUI, mimicking OpenCode's architecture while preserving the existing agent functionality.

## Current State → Target State

| Aspect | Current | Target |
|--------|---------|--------|
| Framework | React 19 + Ink 6 | SolidJS + @opentui/solid |
| State | Polling + EventEmitter | Context Providers + Signals |
| Layout | Simple vertical stack | Header/Sidebar/Footer structure |
| Entry | `render()` from Ink | `render()` from @opentui/solid |

---

## Phase 1: Foundation Setup

### 1.1 Dependencies

Add to `package.json`:
```json
{
  "@opentui/core": "^0.1.63",
  "@opentui/solid": "^0.1.63",
  "solid-js": "^1.8.0",
  "babel-preset-solid": "^1.8.0"
}
```

### 1.2 New Directory Structure

```
src/
├── index.ts                 # Modified: TUI flag routing
├── core/                    # UNCHANGED
├── tui/                     # NEW
│   ├── entry.ts             # OpenTUI initialization
│   ├── app.tsx              # Main component + provider stack
│   ├── context/
│   │   ├── agent.tsx        # AIAgent bridge
│   │   ├── sync.tsx         # EventEmitter → Signals adapter
│   │   ├── theme.tsx
│   │   ├── keybind.tsx
│   │   ├── route.tsx
│   │   ├── dialog.tsx
│   │   ├── command.tsx
│   │   ├── toast.tsx
│   │   └── prompt.tsx
│   ├── routes/
│   │   ├── home.tsx
│   │   └── session/
│   │       ├── index.tsx    # Main session view
│   │       ├── header.tsx
│   │       ├── footer.tsx
│   │       ├── sidebar.tsx
│   │       └── messages.tsx
│   ├── component/
│   │   ├── message/
│   │   │   ├── user-message.tsx
│   │   │   ├── assistant-message.tsx
│   │   │   ├── text-part.tsx
│   │   │   ├── reasoning-part.tsx
│   │   │   └── tool-part.tsx
│   │   ├── dialog/
│   │   │   ├── dialog-command.tsx
│   │   │   ├── dialog-model.tsx
│   │   │   ├── dialog-session.tsx
│   │   │   ├── dialog-confirm.tsx
│   │   │   └── dialog-plan.tsx
│   │   ├── prompt/
│   │   │   ├── index.tsx
│   │   │   ├── autocomplete.tsx
│   │   │   └── history.tsx
│   │   ├── todo-item.tsx
│   │   ├── logo.tsx
│   │   └── border.tsx
│   └── ui/
│       ├── dialog.tsx
│       ├── spinner.tsx
│       └── toast.tsx
└── ui/                      # KEEP for --tui=legacy fallback
```

### 1.3 Build Configuration

Update `tsconfig.json` for SolidJS JSX:
```json
{
  "compilerOptions": {
    "jsx": "preserve",
    "jsxImportSource": "solid-js"
  }
}
```

---

## Phase 2: Context Providers (15 providers)

Provider nesting order:
```
<ExitProvider>
  <ArgsProvider>
    <KeybindProvider>
      <ThemeProvider>
        <AgentProvider>        ← Wraps AIAgent instance
          <SyncProvider>       ← EventEmitter → Signals
            <RouteProvider>
              <DialogProvider>
                <CommandProvider>
                  <PromptProvider>
                    <ToastProvider>
                      <App />
```

### Critical: SyncProvider

Bridge between existing EventEmitter patterns and SolidJS signals:

```typescript
// src/tui/context/sync.tsx
export function SyncProvider(props) {
  const [state, setState] = createStore({
    status: { phase: "idle", message: "" },
    todos: [],
    outputs: [],
    plan: null,
  });

  createEffect(() => {
    // Subscribe to existing EventEmitters
    const unsubStatus = onStatus((s) => setState("status", s));
    const unsubOutput = onToolOutput((o) => {
      setState("outputs", produce(arr => arr.push(o)));
    });
    onCleanup(() => { unsubStatus(); unsubOutput(); });
  });

  return <SyncContext.Provider value={state}>{props.children}</SyncContext.Provider>;
}
```

---

## Phase 3: Core Components

### Component Mapping

| Current | Target | Notes |
|---------|--------|-------|
| `InputBox.tsx` | `prompt/index.tsx` | Add autocomplete, extmarks |
| `StatusBar.tsx` | `session/footer.tsx` | Add tokens, cost display |
| `TodoList.tsx` | `todo-item.tsx` | Preserve logic |
| `ToolOutputDisplay.tsx` | `message/tool-part.tsx` | ScrollBox integration |
| `Confirm.tsx` | `dialog/dialog-confirm.tsx` | Dialog stack |
| `PlanConfirm.tsx` | `dialog/dialog-plan.tsx` | Dialog-based |
| N/A | `session/sidebar.tsx` | NEW |
| N/A | `session/header.tsx` | NEW |

### Session Layout Structure

```
┌─────────────────────────────────────────────────┬──────────────┐
│ Header: Session title, model, navigation        │              │
├─────────────────────────────────────────────────┤   Sidebar    │
│                                                 │  - Session   │
│  ScrollBox: Messages                            │  - Tokens    │
│  - UserMessage                                  │  - LSP       │
│  - AssistantMessage                             │  - Todos     │
│    - TextPart                                   │  - Files     │
│    - ReasoningPart                              │              │
│    - ToolPart                                   │              │
│                                                 │              │
├─────────────────────────────────────────────────┤              │
│ Prompt: Input with autocomplete                 │              │
├─────────────────────────────────────────────────┴──────────────┤
│ Footer: Status, keybinds hints, token count                    │
└────────────────────────────────────────────────────────────────┘
```

### Message Part Types

```typescript
type MessagePart =
  | { type: "text"; content: string }
  | { type: "reasoning"; content: string; collapsed: boolean }
  | { type: "tool"; name: string; input: any; output: string; status: "running" | "done" | "error" }
```

---

## Phase 4: Dialog & Command System

### Dialogs to Implement

1. `dialog-command.tsx` - Command palette (fuzzy search)
2. `dialog-model.tsx` - Model selection
3. `dialog-session.tsx` - Session list/management
4. `dialog-theme.tsx` - Theme picker
5. `dialog-confirm.tsx` - Yes/No prompts
6. `dialog-plan.tsx` - Plan approval (from PlanConfirm)

### Command Registration Pattern

```typescript
command.register({
  name: "model.switch",
  label: "Switch Model",
  category: "agent",
  keybind: "ctrl+m",
  action: async () => { /* ... */ }
});
```

### Default Keybinds

| Key | Action |
|-----|--------|
| `Ctrl+C` | Exit |
| `Ctrl+P` | Command palette |
| `Ctrl+M` | Switch model |
| `Ctrl+T` | Toggle theme |
| `Ctrl+L` | Clear prompt |
| `Ctrl+S` | Session list |

---

## Phase 5: Advanced Features

### Sidebar Sections

1. **Session Info** - Title, ID, share URL
2. **Context Usage** - Token count + cost
3. **LSP Servers** - Active language servers
4. **Todos** - Current task list
5. **Modified Files** - Files changed

### Theme System

- Auto light/dark detection via OSC 11
- Multiple built-in themes (Catppuccin, Dracula, Nord, etc.)

---

## Critical Files

| File | Action |
|------|--------|
| `src/index.ts` | Modify: Add TUI flag routing |
| `src/tui/entry.ts` | Create: OpenTUI initialization |
| `src/tui/app.tsx` | Create: Provider stack + routing |
| `src/tui/context/sync.tsx` | Create: EventEmitter bridge |
| `src/tui/routes/session/index.tsx` | Create: Main session view |
| `src/core/agent.ts` | Reference only (no changes) |
| `package.json` | Modify: Add dependencies |
| `tsconfig.json` | Modify: SolidJS JSX config |

---

## Rollout Strategy

1. **Dev Phase**: New TUI behind `--experimental-tui` flag
2. **Beta Phase**: Opt-in via `--tui=solid` flag
3. **Release**: New TUI default, `--tui=legacy` for React/Ink
4. **Cleanup**: Remove React/Ink after stabilization

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| OpenTUI instability | Pin versions, keep Ink fallback |
| EventEmitter → Signals bugs | Comprehensive SyncProvider testing |
| Terminal compatibility | Test on iTerm2, Terminal.app, Alacritty |
| Build complexity | Reference create-tui config |

---

## Implementation Order

1. Set up dependencies and build config
2. Create `src/tui/entry.ts` with basic render
3. Implement context providers (sync first)
4. Build session layout (header/footer/sidebar)
5. Migrate message rendering
6. Implement prompt with autocomplete
7. Add dialog system
8. Add command palette
9. Theme system and polish
10. Testing and bug fixes

---

## References

- [OpenTUI GitHub](https://github.com/sst/opentui)
- [OpenCode TUI](https://github.com/sst/opencode/tree/dev/packages/opencode/src/cli/cmd/tui)
- [@opentui/core npm](https://www.npmjs.com/package/@opentui/core)
