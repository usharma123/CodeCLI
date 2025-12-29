/* @jsxImportSource solid-js */
/// <reference path="../../types.d.ts" />
/**
 * Prompt Component
 *
 * Main input component with mode detection and autocomplete.
 */

import { Show, createSignal, createMemo, createEffect } from "solid-js";
import { useTheme } from "../../context/theme.js";
import { usePrompt } from "../../context/prompt.js";
import { useSync } from "../../context/sync.js";
import { Autocomplete } from "./autocomplete.js";

interface PromptProps {
  onSubmit: (value: string) => Promise<void>;
}

export function Prompt(props: PromptProps) {
  const { theme } = useTheme();
  const { value, setValue, mode, addToHistory, navigateHistory, clear } = usePrompt();
  const { state } = useSync();

  const [showAutocomplete, setShowAutocomplete] = createSignal(false);
  const [isSubmitting, setIsSubmitting] = createSignal(false);

  // Get border color based on mode
  const borderColor = createMemo(() => {
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

  // Get mode icon
  const modeIcon = createMemo(() => {
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

  // Handle input change
  const handleChange = (newValue: string) => {
    setValue(newValue);

    // Show autocomplete for commands
    if (newValue.startsWith("/") && newValue.length > 1) {
      setShowAutocomplete(true);
    } else {
      setShowAutocomplete(false);
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    const currentValue = value();
    if (!currentValue.trim() || isSubmitting()) return;

    setIsSubmitting(true);
    setShowAutocomplete(false);

    try {
      await props.onSubmit(currentValue);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle key events
  const handleKeyDown = (key: string, ctrl: boolean) => {
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
      // Handle autocomplete selection
    }
  };

  return (
    <box flexDirection="column">
      {/* Autocomplete dropdown */}
      <Show when={showAutocomplete()}>
        <Autocomplete
          query={value().slice(1)}
          onSelect={(cmd) => {
            setValue(`/${cmd} `);
            setShowAutocomplete(false);
          }}
          onClose={() => setShowAutocomplete(false)}
        />
      </Show>

      {/* Input box */}
      <box
        borderStyle="single"
        borderColor={borderColor()}
        paddingX={1}
        flexDirection="row"
      >
        {/* Mode icon */}
        <text color={borderColor()} bold>
          {modeIcon()}{" "}
        </text>

        {/* Input field */}
        <input
          value={value()}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e.key, e.ctrlKey)}
          placeholder={
            state.isProcessing
              ? "Processing..."
              : mode() === "command"
                ? "Type a command..."
                : mode() === "file"
                  ? "Enter file path..."
                  : mode() === "shell"
                    ? "Enter shell command..."
                    : "Type a message..."
          }
          disabled={isSubmitting()}
          focus
          flexGrow={1}
        />

        {/* Submit indicator */}
        <Show when={value().trim()}>
          <text color={theme().colors.muted}> [Enter]</text>
        </Show>
      </box>

      {/* Help text */}
      <Show when={!value() && !state.isProcessing}>
        <box marginTop={1}>
          <text color={theme().colors.muted}>
            {theme().icons.command} command | {theme().icons.file} file | {theme().icons.shell} shell
          </text>
        </box>
      </Show>
    </box>
  );
}
