import React from "react";
import { Box, Text } from "ink";
import { icons } from "../theme.js";
import { useSpinnerFrames } from "../hooks/useAnimation.js";
import { ProgressBar } from "./ProgressBar.js";

interface TodoItem {
  content: string;
  status: "pending" | "in_progress" | "completed";
  activeForm?: string;
}

interface TodoListProps {
  todos: TodoItem[];
  showProgress?: boolean;
  compact?: boolean;
}

export function TodoList({ todos, showProgress = true, compact = false }: TodoListProps) {
  if (todos.length === 0) return null;

  const completedCount = todos.filter((t) => t.status === "completed").length;
  const totalCount = todos.length;
  const progress = (completedCount / totalCount) * 100;
  const allCompleted = completedCount === totalCount;

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor={allCompleted ? "green" : "gray"}
      paddingX={1}
      marginBottom={1}
    >
      {/* Header */}
      <Box marginBottom={compact ? 0 : 1}>
        <Text color={allCompleted ? "green" : "white"}>
          tasks
        </Text>
        <Text dimColor>
          {" "}
          {completedCount}/{totalCount}
        </Text>
        {allCompleted && (
          <Text color="green"> {icons.success}</Text>
        )}
      </Box>

      {/* Progress bar */}
      {showProgress && !compact && (
        <Box marginBottom={1}>
          <ProgressBar
            progress={progress}
            color={allCompleted ? "green" : "cyan"}
            size="compact"
            showPercentage={false}
          />
        </Box>
      )}

      {/* Items */}
      {todos.map((todo, i) => (
        <TodoItemRow key={i} todo={todo} />
      ))}
    </Box>
  );
}

interface TodoItemRowProps {
  todo: TodoItem;
}

function TodoItemRow({ todo }: TodoItemRowProps) {
  const spinnerFrame = useSpinnerFrames(icons.spinnerDots, 80);

  let icon: string;
  let color: "green" | "yellow" | "gray";

  switch (todo.status) {
    case "completed":
      icon = icons.success;
      color = "green";
      break;
    case "in_progress":
      icon = spinnerFrame;
      color = "yellow";
      break;
    default:
      icon = icons.pending;
      color = "gray";
  }

  const displayText =
    todo.status === "in_progress" && todo.activeForm
      ? todo.activeForm
      : todo.content;

  return (
    <Box flexDirection="row">
      <Text color={color}>
        {icon}{" "}
      </Text>
      <Box flexGrow={1} flexShrink={1}>
        <Text
          color={color}
          dimColor={todo.status === "pending"}
          strikethrough={todo.status === "completed"}
          wrap="wrap"
        >
          {displayText}
        </Text>
      </Box>
    </Box>
  );
}

// Compact count display
export function TodoCount({ todos }: { todos: TodoItem[] }) {
  if (todos.length === 0) return null;

  const completedCount = todos.filter((t) => t.status === "completed").length;
  const inProgressCount = todos.filter((t) => t.status === "in_progress").length;
  const totalCount = todos.length;

  return (
    <Box>
      <Text dimColor>tasks: </Text>
      {inProgressCount > 0 && (
        <Text color="yellow">{inProgressCount} active</Text>
      )}
      {inProgressCount > 0 && completedCount > 0 && <Text dimColor> {icons.pipe} </Text>}
      {completedCount > 0 && (
        <Text color="green">
          {completedCount}/{totalCount}
        </Text>
      )}
    </Box>
  );
}
