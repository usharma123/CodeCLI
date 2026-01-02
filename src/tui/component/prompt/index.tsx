/* @jsxImportSource @opentui/solid */
/// <reference path="../../types.d.ts" />
/**
 * Prompt Component
 *
 * Main input component for user queries.
 * Based on OpenCode's implementation using textarea component with ref.
 */

import { type KeyBinding, type TextareaRenderable } from "@opentui/core";
import { Show, createSignal, onMount } from "solid-js";
import { useTheme } from "../../context/theme.js";
import { useSync } from "../../context/sync.js";
import { usePrompt } from "../../context/prompt.js";
import { useKeybind } from "../../context/keybind.js";
import { useExit } from "../../context/exit.js";

interface PromptProps {
  onSubmit: (value: string) => Promise<void>;
}

export function Prompt(props: PromptProps) {
  const { theme } = useTheme();
  const { state } = useSync();
  const { value, setValue, addToHistory } = usePrompt();
  const keybind = useKeybind();
  const exit = useExit();

  const [isSubmitting, setIsSubmitting] = createSignal(false);
  let inputRef: TextareaRenderable;

  const handleContentChange = () => {
    // Get the plain text from the textarea ref
    if (inputRef) {
      const newValue = inputRef.plainText || "";
      setValue(newValue);
    }
  };

  const submit = async () => {
    const submittedValue = inputRef?.plainText || value();
    
    if (!submittedValue?.trim() || isSubmitting()) {
      return;
    }

    setIsSubmitting(true);
    
    // Add to history before submitting
    addToHistory(submittedValue);

    try {
      await props.onSubmit(submittedValue);
      // Clear input after successful submission
      if (inputRef) {
        inputRef.clear();
      }
      setValue("");
    } catch (error) {
      // Keep input on error so user can retry
    } finally {
      setIsSubmitting(false);
    }
  };

  // Note: onKeyDown prop doesn't work in OpenTUI - use keyBindings for key handling
  // For global shortcuts like Ctrl+C, we'd need useKeyboard hook at app level

  onMount(() => {
    // Focus the input on mount
    if (inputRef) {
      inputRef.focus();
    }
  });

  // Custom key bindings to make Enter submit instead of newline
  // Meta+Enter for newlines (matches OpenCode's behavior)
  const textareaKeyBindings: KeyBinding[] = [
    { name: "return", action: "submit" },
    { name: "return", meta: true, action: "newline" },
  ];

  return (
    <box flexDirection="column" flexShrink={0}>
      <box
        borderStyle="single"
        borderColor={theme().colors.border}
        paddingX={1}
        paddingY={0}
        flexDirection="row"
        backgroundColor={theme().colors.background}
      >
        <text color={theme().colors.accent} bold>
          {">"}{" "}
        </text>

        <textarea
          ref={(r: TextareaRenderable) => {
            inputRef = r;
            if (r) {
              // Focus after a tick
              setTimeout(() => {
                r.cursorColor = theme().colors.accent;
                r.focus();
              }, 0);
            }
          }}
          placeholder={state.isProcessing ? "Processing..." : "Type a message..."}
          onContentChange={handleContentChange}
          keyBindings={textareaKeyBindings}
          onSubmit={submit}
          minHeight={1}
          maxHeight={6}
          flexGrow={1}
          textColor={theme().colors.foreground}
          focusedTextColor={theme().colors.foreground}
          cursorColor={theme().colors.accent}
          focusedBackgroundColor={theme().colors.background}
        />
      </box>

      <Show when={state.isProcessing}>
        <box paddingX={1}>
          <text color={theme().colors.primary}>
            {state.status.message || "Processing..."}
          </text>
        </box>
      </Show>
    </box>
  );
}
