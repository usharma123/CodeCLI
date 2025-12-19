import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import {
  onToolOutput,
  getOutputById,
  type ToolOutput,
} from "../../core/output.js";
import { icons, formatRelativeTime } from "../theme.js";

interface ToolOutputDisplayProps {
  expandedOutputId: string | null;
}

export function ToolOutputDisplay({ expandedOutputId }: ToolOutputDisplayProps) {
  const [outputs, setOutputs] = useState<ToolOutput[]>([]);

  useEffect(() => {
    const unsubscribe = onToolOutput((output) => {
      setOutputs((prev) => {
        const newOutputs = [...prev, output];
        if (newOutputs.length > 10) {
          return newOutputs.slice(-10);
        }
        return newOutputs;
      });
    });

    return unsubscribe;
  }, []);

  if (!expandedOutputId) {
    return null;
  }

  const output = getOutputById(expandedOutputId);
  if (!output) {
    return null;
  }

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor="blue"
      paddingX={1}
      marginBottom={1}
    >
      {/* Header */}
      <Box marginBottom={1}>
        <Text color="blue">output</Text>
        <Box flexGrow={1} />
        <Text dimColor>^o close</Text>
      </Box>

      {/* Metadata */}
      <Box flexDirection="column" marginBottom={1}>
        <Box>
          <Text dimColor>tool: </Text>
          <Text color="cyan">{output.toolName}</Text>
        </Box>
        <Box>
          <Text dimColor>time: </Text>
          <Text>{formatRelativeTime(output.timestamp)}</Text>
        </Box>
      </Box>

      {/* Arguments (collapsed by default) */}
      <Box flexDirection="column" marginBottom={1}>
        <Text dimColor>args: {JSON.stringify(output.args).substring(0, 60)}...</Text>
      </Box>

      {/* Content */}
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text dimColor>result:</Text>
        </Box>
        <OutputContent content={output.result} />
      </Box>
    </Box>
  );
}

interface OutputContentProps {
  content: string;
}

function OutputContent({ content }: OutputContentProps) {
  // Detect content type
  const looksLikeJson =
    (content.trim().startsWith("{") && content.trim().endsWith("}")) ||
    (content.trim().startsWith("[") && content.trim().endsWith("]"));

  const looksLikeFilePaths =
    content.includes("/") &&
    content.split("\n").filter(l => l.trim()).every((line) =>
      line.trim().startsWith("/") || line.trim() === ""
    );

  if (looksLikeJson) {
    try {
      const formatted = JSON.stringify(JSON.parse(content), null, 2);
      return (
        <Box borderStyle="single" borderColor="gray" paddingX={1}>
          <Text color="yellow" wrap="wrap">
            {formatted.substring(0, 2000)}
            {formatted.length > 2000 && "..."}
          </Text>
        </Box>
      );
    } catch {
      // Not valid JSON
    }
  }

  if (looksLikeFilePaths) {
    const lines = content.split("\n").filter((l) => l.trim());
    return (
      <Box flexDirection="column" paddingX={1}>
        {lines.slice(0, 20).map((line, i) => (
          <Box key={i}>
            <Text dimColor>{icons.bullet} </Text>
            <Text>{line.trim()}</Text>
          </Box>
        ))}
        {lines.length > 20 && (
          <Text dimColor>+{lines.length - 20} more</Text>
        )}
      </Box>
    );
  }

  // Default: plain text with line numbers
  const lines = content.split("\n");
  const showLineNumbers = lines.length > 5;

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="gray" paddingX={1}>
      {lines.slice(0, 50).map((line, i) => (
        <Box key={i}>
          {showLineNumbers && (
            <Box minWidth={4}>
              <Text dimColor>{i + 1}</Text>
            </Box>
          )}
          <Text wrap="wrap">{line}</Text>
        </Box>
      ))}
      {lines.length > 50 && (
        <Text dimColor>+{lines.length - 50} lines</Text>
      )}
    </Box>
  );
}

// Compact preview
export function OutputPreview({
  output,
  maxLength = 80,
}: {
  output: ToolOutput;
  maxLength?: number;
}) {
  const preview =
    output.result.length > maxLength
      ? output.result.substring(0, maxLength) + "..."
      : output.result;

  return (
    <Box>
      <Text dimColor>{output.toolName}: </Text>
      <Text dimColor wrap="truncate">{preview.replace(/\n/g, " ")}</Text>
    </Box>
  );
}
