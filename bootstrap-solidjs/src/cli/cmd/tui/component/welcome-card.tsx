import { TextAttributes } from "@opentui/core"
import { useTheme } from "@tui/context/theme"
import { useKeybind } from "@tui/context/keybind"
import { EmptyBorder } from "./border"

const QUICK_START_ITEMS = [
  { key: "command_list", label: "Open command palette" },
  { key: "agent_cycle", label: "Switch between agents" },
  { key: "theme_list", label: "Change theme" },
] as const

export function WelcomeCard() {
  const { theme } = useTheme()
  const keybind = useKeybind()

  const BOX_WIDTH = 50
  const TITLE = " Getting Started "
  const dashes = Math.max(0, BOX_WIDTH - 2 - TITLE.length - 1)

  return (
    <box position="absolute" bottom={3} right={2} width={BOX_WIDTH}>
      <text>
        <span style={{ fg: theme.border }}>╭─</span>
        <span style={{ fg: theme.primary }}>{TITLE}</span>
        <span style={{ fg: theme.border }}>{"─".repeat(dashes)}╮</span>
      </text>
      <box
        border={["left", "right", "bottom"]}
        borderColor={theme.border}
        customBorderChars={{
          ...EmptyBorder,
          bottomLeft: "╰",
          bottomRight: "╯",
          horizontal: "─",
          vertical: "│",
        }}
      >
        <box paddingLeft={2} paddingRight={2} paddingTop={1} paddingBottom={1} gap={1}>
          <text fg={theme.textMuted}>
            Welcome! Type a message to get started, or use these shortcuts:
          </text>

          <box gap={0} paddingTop={1}>
            {QUICK_START_ITEMS.map((item) => {
              const printed = keybind.print(item.key)
              return (
                <box flexDirection="row" justifyContent="space-between">
                  <text fg={theme.textMuted}>{item.label}</text>
                  <text fg={theme.text} attributes={TextAttributes.BOLD}>
                    {printed}
                  </text>
                </box>
              )
            })}
          </box>

          <box paddingTop={1}>
            <text fg={theme.textMuted}>
              <span style={{ fg: theme.text }}>@</span> to attach files {"  "}
              <span style={{ fg: theme.text }}>!</span> to run commands
            </text>
          </box>
        </box>
      </box>
    </box>
  )
}
