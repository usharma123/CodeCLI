/* @jsxImportSource solid-js */
/// <reference path="../types.d.ts" />
/**
 * Dialog UI Components
 *
 * Modal dialog primitives for confirmations, prompts, and selections.
 */
import { Show, For, createSignal, Switch, Match } from "solid-js";
import { useTheme } from "../context/theme.js";
import { useDialog } from "../context/dialog.js";
export function DialogContainer() {
    const { current, close } = useDialog();
    const { theme } = useTheme();
    return (<Show when={current()}>
      {(config) => (<box position="absolute" top={0} left={0} right={0} bottom={0} justifyContent="center" alignItems="center">
          {/* Backdrop */}
          <box position="absolute" top={0} left={0} right={0} bottom={0} backgroundColor="rgba(0,0,0,0.5)"/>

          {/* Dialog */}
          <box borderStyle="double" borderColor={theme().colors.primary} backgroundColor={theme().colors.background} padding={2} minWidth={40} maxWidth={60} flexDirection="column">
            <Switch>
              <Match when={config().type === "confirm"}>
                <ConfirmDialog config={config()}/>
              </Match>
              <Match when={config().type === "alert"}>
                <AlertDialog config={config()}/>
              </Match>
              <Match when={config().type === "prompt"}>
                <PromptDialog config={config()}/>
              </Match>
              <Match when={config().type === "select"}>
                <SelectDialog config={config()}/>
              </Match>
            </Switch>
          </box>
        </box>)}
    </Show>);
}
function ConfirmDialog(props) {
    const { theme } = useTheme();
    const [selected, setSelected] = createSignal("yes");
    const handleConfirm = () => {
        if (selected() === "yes") {
            props.config.onConfirm?.();
        }
        else {
            props.config.onCancel?.();
        }
    };
    return (<box flexDirection="column">
      {/* Title */}
      <Show when={props.config.title}>
        <text bold marginBottom={1}>
          {props.config.title}
        </text>
      </Show>

      {/* Message */}
      <text wrap="wrap" marginBottom={2}>
        {props.config.message}
      </text>

      {/* Buttons */}
      <box flexDirection="row" gap={2} justifyContent="center">
        <box borderStyle="single" borderColor={selected() === "yes" ? theme().colors.success : theme().colors.border} paddingX={2}>
          <text bold={selected() === "yes"} color={selected() === "yes" ? theme().colors.success : undefined}>
            Yes (y)
          </text>
        </box>
        <box borderStyle="single" borderColor={selected() === "no" ? theme().colors.error : theme().colors.border} paddingX={2}>
          <text bold={selected() === "no"} color={selected() === "no" ? theme().colors.error : undefined}>
            No (n)
          </text>
        </box>
      </box>

      {/* Hint */}
      <text color={theme().colors.muted} marginTop={1} textAlign="center">
        Arrow keys to select, Enter to confirm
      </text>
    </box>);
}
function AlertDialog(props) {
    const { theme } = useTheme();
    return (<box flexDirection="column">
      {/* Title */}
      <Show when={props.config.title}>
        <text bold marginBottom={1}>
          {props.config.title}
        </text>
      </Show>

      {/* Message */}
      <text wrap="wrap" marginBottom={2}>
        {props.config.message}
      </text>

      {/* OK button */}
      <box flexDirection="row" justifyContent="center">
        <box borderStyle="single" borderColor={theme().colors.primary} paddingX={3}>
          <text bold color={theme().colors.primary}>
            OK (Enter)
          </text>
        </box>
      </box>
    </box>);
}
function PromptDialog(props) {
    const { theme } = useTheme();
    const [value, setValue] = createSignal(props.config.defaultValue || "");
    const handleSubmit = () => {
        props.config.onConfirm?.(value());
    };
    return (<box flexDirection="column">
      {/* Title */}
      <Show when={props.config.title}>
        <text bold marginBottom={1}>
          {props.config.title}
        </text>
      </Show>

      {/* Message */}
      <text wrap="wrap" marginBottom={1}>
        {props.config.message}
      </text>

      {/* Input */}
      <box borderStyle="single" borderColor={theme().colors.primary} padding={1}>
        <input value={value()} onChange={(e) => setValue(e.target.value)} focus flexGrow={1}/>
      </box>

      {/* Hint */}
      <text color={theme().colors.muted} marginTop={1}>
        Enter to submit, Esc to cancel
      </text>
    </box>);
}
function SelectDialog(props) {
    const { theme } = useTheme();
    const [selectedIndex, setSelectedIndex] = createSignal(0);
    const options = () => props.config.options || [];
    const handleSelect = () => {
        const option = options()[selectedIndex()];
        if (option) {
            props.config.onConfirm?.(option.value);
        }
    };
    return (<box flexDirection="column">
      {/* Title */}
      <Show when={props.config.title}>
        <text bold marginBottom={1}>
          {props.config.title}
        </text>
      </Show>

      {/* Message */}
      <Show when={props.config.message}>
        <text wrap="wrap" marginBottom={1}>
          {props.config.message}
        </text>
      </Show>

      {/* Options */}
      <box flexDirection="column" marginY={1}>
        <For each={options()}>
          {(option, index) => (<box paddingX={1} backgroundColor={index() === selectedIndex() ? theme().colors.accent : undefined}>
              <text color={index() === selectedIndex()
                ? theme().colors.background
                : theme().colors.foreground} bold={index() === selectedIndex()}>
                {index() === selectedIndex() ? theme().icons.arrow : " "}{" "}
                {option.label}
              </text>
            </box>)}
        </For>
      </box>

      {/* Hint */}
      <text color={theme().colors.muted}>
        Arrow keys to navigate, Enter to select, Esc to cancel
      </text>
    </box>);
}
