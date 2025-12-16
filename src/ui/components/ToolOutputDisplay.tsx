import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { onToolOutput, getOutputById, type ToolOutput } from "../../core/output.js";

interface ToolOutputDisplayProps {
  expandedOutputId: string | null;
}

export function ToolOutputDisplay({ expandedOutputId }: ToolOutputDisplayProps) {
  const [outputs, setOutputs] = useState<ToolOutput[]>([]);

  // Subscribe to tool output events
  useEffect(() => {
    const unsubscribe = onToolOutput((output) => {
      setOutputs((prev) => {
        const newOutputs = [...prev, output];
        // Keep only last 10 outputs
        if (newOutputs.length > 10) {
          return newOutputs.slice(-10);
        }
        return newOutputs;
      });
    });

    return unsubscribe;
  }, []);

  // If no output is expanded, don't render anything
  if (!expandedOutputId) {
    return null;
  }

  // Find the output to display
  const output = getOutputById(expandedOutputId);
  if (!output) {
    return null;
  }

  // Format timestamp
  const date = new Date(output.timestamp);
  const timeStr = date.toLocaleTimeString();

  // Format args for display
  const argsStr = JSON.stringify(output.args, null, 2);

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="yellow"
      paddingX={1}
      marginBottom={1}
    >
      <Box flexDirection="column" marginBottom={1}>
        <Text bold color="yellow">
          Expanded Output
        </Text>
        <Box>
          <Text dimColor>Tool: </Text>
          <Text color="cyan">{output.toolName}</Text>
          <Text dimColor> │ Time: {timeStr}</Text>
        </Box>
        <Box marginTop={1}>
          <Text dimColor>Arguments:</Text>
        </Box>
        <Text dimColor>{argsStr}</Text>
      </Box>

      <Box flexDirection="column" borderStyle="single" borderColor="gray" paddingX={1}>
        <Text wrap="wrap">{output.result}</Text>
      </Box>

      <Box marginTop={1}>
        <Text dimColor italic>
          Press Ctrl+O to collapse
        </Text>
      </Box>
    </Box>
  );
}
