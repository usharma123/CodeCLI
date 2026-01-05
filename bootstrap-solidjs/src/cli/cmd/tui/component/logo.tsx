import { TextAttributes } from "@opentui/core"
import { For } from "solid-js"
import { useTheme } from "@tui/context/theme"

// Bootstrap ASCII art logo
const LOGO_LINES = [
  "██████╗  ██████╗  ██████╗ ████████╗███████╗████████╗██████╗  █████╗ ██████╗ ",
  "██╔══██╗██╔═══██╗██╔═══██╗╚══██╔══╝██╔════╝╚══██╔══╝██╔══██╗██╔══██╗██╔══██╗",
  "██████╔╝██║   ██║██║   ██║   ██║   ███████╗   ██║   ██████╔╝███████║██████╔╝",
  "██╔══██╗██║   ██║██║   ██║   ██║   ╚════██║   ██║   ██╔══██╗██╔══██║██╔═══╝ ",
  "██████╔╝╚██████╔╝╚██████╔╝   ██║   ███████║   ██║   ██║  ██║██║  ██║██║     ",
  "╚═════╝  ╚═════╝  ╚═════╝    ╚═╝   ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     "
]

export function Logo() {
  const { theme } = useTheme()
  return (
    <box>
      <For each={LOGO_LINES}>
        {(line) => (
          <text fg={theme.primary} attributes={TextAttributes.BOLD} selectable={false}>
            {line}
          </text>
        )}
      </For>
    </box>
  )
}
