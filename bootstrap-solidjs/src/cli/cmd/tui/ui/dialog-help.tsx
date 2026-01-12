import { TextAttributes } from "@opentui/core"
import { useTheme } from "@tui/context/theme"
import { useDialog } from "./dialog"
import { useKeyboard } from "@opentui/solid"
import { useKeybind } from "@tui/context/keybind"
import { For, createSignal } from "solid-js"
import type { KeybindsConfig } from "@opencode-ai/sdk/v2"

type KeybindCategory = {
  title: string
  items: { key: keyof KeybindsConfig; label: string }[]
}

const KEYBIND_CATEGORIES: KeybindCategory[] = [
  {
    title: "General",
    items: [
      { key: "command_list", label: "Command palette" },
      { key: "app_exit", label: "Exit application" },
      { key: "status_view", label: "View status" },
      { key: "editor_open", label: "Open external editor" },
      { key: "terminal_suspend", label: "Suspend terminal" },
    ],
  },
  {
    title: "Session",
    items: [
      { key: "session_new", label: "New session" },
      { key: "session_list", label: "List sessions" },
      { key: "session_timeline", label: "Show timeline" },
      { key: "session_compact", label: "Compact session" },
      { key: "session_export", label: "Export session" },
      { key: "session_interrupt", label: "Interrupt" },
    ],
  },
  {
    title: "Navigation",
    items: [
      { key: "messages_page_up", label: "Page up" },
      { key: "messages_page_down", label: "Page down" },
      { key: "messages_half_page_up", label: "Half page up" },
      { key: "messages_half_page_down", label: "Half page down" },
      { key: "messages_first", label: "First message" },
      { key: "messages_last", label: "Last message" },
    ],
  },
  {
    title: "Model & Agent",
    items: [
      { key: "model_list", label: "Select model" },
      { key: "model_cycle_recent", label: "Cycle recent models" },
      { key: "agent_list", label: "Select agent" },
      { key: "agent_cycle", label: "Cycle agents" },
      { key: "variant_cycle", label: "Cycle variants" },
    ],
  },
  {
    title: "Messages",
    items: [
      { key: "messages_copy", label: "Copy message" },
      { key: "messages_undo", label: "Undo" },
      { key: "messages_redo", label: "Redo" },
      { key: "messages_toggle_conceal", label: "Toggle code blocks" },
    ],
  },
  {
    title: "UI",
    items: [
      { key: "theme_list", label: "Change theme" },
      { key: "sidebar_toggle", label: "Toggle sidebar" },
      { key: "tips_toggle", label: "Toggle tips" },
    ],
  },
]

export function DialogHelp() {
  const dialog = useDialog()
  const { theme } = useTheme()
  const keybind = useKeybind()
  const [selectedCategory, setSelectedCategory] = createSignal(0)

  useKeyboard((evt) => {
    if (evt.name === "return" || evt.name === "escape") {
      dialog.clear()
      return
    }
    if (evt.name === "left" || evt.name === "h") {
      setSelectedCategory((prev) => Math.max(0, prev - 1))
      return
    }
    if (evt.name === "right" || evt.name === "l") {
      setSelectedCategory((prev) => Math.min(KEYBIND_CATEGORIES.length - 1, prev + 1))
      return
    }
  })

  const currentCategory = () => KEYBIND_CATEGORIES[selectedCategory()]

  return (
    <box paddingLeft={2} paddingRight={2} gap={1}>
      <box flexDirection="row" justifyContent="space-between">
        <text attributes={TextAttributes.BOLD} fg={theme.text}>
          Keyboard Shortcuts
        </text>
        <text fg={theme.textMuted}>esc to close</text>
      </box>

      {/* Category tabs */}
      <box flexDirection="row" gap={1} flexWrap="wrap">
        <For each={KEYBIND_CATEGORIES}>
          {(category, index) => (
            <box
              paddingLeft={1}
              paddingRight={1}
              backgroundColor={selectedCategory() === index() ? theme.primary : undefined}
              onMouseUp={() => setSelectedCategory(index())}
            >
              <text
                fg={selectedCategory() === index() ? theme.selectedListItemText : theme.textMuted}
                attributes={selectedCategory() === index() ? TextAttributes.BOLD : undefined}
              >
                {category.title}
              </text>
            </box>
          )}
        </For>
      </box>

      {/* Keybind list */}
      <box paddingTop={1} paddingBottom={1} gap={0}>
        <For each={currentCategory()?.items}>
          {(item) => {
            const printed = keybind.print(item.key)
            if (!printed) return null
            return (
              <box flexDirection="row" justifyContent="space-between" paddingRight={2}>
                <text fg={theme.textMuted}>{item.label}</text>
                <text fg={theme.text} attributes={TextAttributes.BOLD}>
                  {printed}
                </text>
              </box>
            )
          }}
        </For>
      </box>

      {/* Footer hint */}
      <box flexDirection="row" justifyContent="space-between" paddingTop={1}>
        <text fg={theme.textMuted}>
          <span style={{ fg: theme.text }}>{keybind.print("command_list")}</span> for all commands
        </text>
        <text fg={theme.textMuted}>
          <span style={{ fg: theme.text }}>{"<-/->"}</span> switch category
        </text>
      </box>
    </box>
  )
}
