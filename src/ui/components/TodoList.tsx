import React from "react";
import { Box, Text } from "ink";

interface TodoItem {
  content: string;
  status: "pending" | "in_progress" | "completed";
}

interface TodoListProps {
  todos: TodoItem[];
}

export function TodoList({ todos }: TodoListProps) {
  if (todos.length === 0) return null;

  return (
    <Box flexDirection="column" marginBottom={1} paddingLeft={1}>
      <Text bold color="cyan">
        Task Progress:
      </Text>
      {todos.map((todo, i) => {
        const icon =
          todo.status === "completed"
            ? "✓"
            : todo.status === "in_progress"
            ? "→"
            : "○";
        const color =
          todo.status === "completed"
            ? "green"
            : todo.status === "in_progress"
            ? "yellow"
            : "gray";

        return (
          <Box key={i} flexDirection="row">
            <Text color={color}>{icon} </Text>
            <Box flexGrow={1} flexShrink={1}>
              <Text
                color={color}
                dimColor={todo.status === "completed"}
                wrap="wrap"
              >
                {todo.content}
              </Text>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
