/* @jsxImportSource solid-js */
/// <reference path="../types.d.ts" />
/**
 * Toast UI Component
 *
 * Notification toasts displayed at the bottom of the screen.
 */
import { For, Show, createMemo } from "solid-js";
import { useTheme } from "../context/theme.js";
import { useToast } from "../context/toast.js";
export function ToastContainer() {
    const { toasts } = useToast();
    const { theme } = useTheme();
    return (<Show when={toasts().length > 0}>
      <box position="absolute" bottom={2} right={2} flexDirection="column" gap={1}>
        <For each={toasts()}>
          {(toast) => <ToastItem toast={toast}/>}
        </For>
      </box>
    </Show>);
}
function ToastItem(props) {
    const { theme } = useTheme();
    const { dismiss } = useToast();
    const getToastStyle = (type) => {
        switch (type) {
            case "success":
                return {
                    icon: theme().icons.success,
                    color: theme().colors.success,
                    borderColor: theme().colors.success,
                };
            case "error":
                return {
                    icon: theme().icons.error,
                    color: theme().colors.error,
                    borderColor: theme().colors.error,
                };
            case "warning":
                return {
                    icon: theme().icons.warning,
                    color: theme().colors.warning,
                    borderColor: theme().colors.warning,
                };
            default:
                return {
                    icon: theme().icons.info,
                    color: theme().colors.info,
                    borderColor: theme().colors.info,
                };
        }
    };
    const style = createMemo(() => getToastStyle(props.toast.type));
    return (<box borderStyle="single" borderColor={style().borderColor} backgroundColor={theme().colors.background} paddingX={2} paddingY={1} minWidth={30} maxWidth={50}>
      <box flexDirection="row" gap={1}>
        <text color={style().color}>{style().icon}</text>
        <text wrap="wrap">{props.toast.message}</text>
      </box>

      {/* Action button if provided */}
      <Show when={props.toast.action}>
        {(action) => (<box marginTop={1}>
            <text color={theme().colors.accent} bold>
              [{action().label}]
            </text>
          </box>)}
      </Show>
    </box>);
}
