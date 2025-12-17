import React from "react";
import { Box, Text } from "ink";

/**
 * Props for the DiagramDisplay component
 */
interface DiagramDisplayProps {
  /** The ASCII diagram content to display */
  ascii: string;
  /** Optional title to show above the diagram */
  title?: string;
  /** Whether to show a border around the diagram */
  bordered?: boolean;
  /** Border color (default: cyan) */
  borderColor?: string;
  /** Whether rendering was successful (affects styling) */
  success?: boolean;
  /** Error message to display if rendering failed */
  error?: string;
}

/**
 * DiagramDisplay - Ink component for displaying ASCII diagrams
 * 
 * Renders ASCII art diagrams with optional title and border styling.
 * Handles both successful renders and fallback error states.
 */
export const DiagramDisplay: React.FC<DiagramDisplayProps> = ({
  ascii,
  title,
  bordered = true,
  borderColor = "cyan",
  success = true,
  error,
}) => {
  // If there's an error, show warning styling
  if (error || !success) {
    return (
      <Box flexDirection="column" marginY={1}>
        {error && (
          <Box marginBottom={1}>
            <Text color="yellow">⚠️  {error}</Text>
          </Box>
        )}
        {ascii && (
          <Box
            flexDirection="column"
            borderStyle={bordered ? "single" : undefined}
            borderColor="gray"
            paddingX={1}
          >
            {title && (
              <Text bold color="gray">
                {title}
              </Text>
            )}
            <Text color="gray">{ascii}</Text>
          </Box>
        )}
      </Box>
    );
  }

  // Success state - show diagram with nice styling
  if (bordered) {
    return (
      <Box flexDirection="column" marginY={1}>
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor={borderColor}
          paddingX={1}
          paddingY={0}
        >
          {title && (
            <Box marginBottom={1}>
              <Text bold color={borderColor}>
                📊 {title}
              </Text>
            </Box>
          )}
          <Text>{ascii}</Text>
        </Box>
      </Box>
    );
  }

  // No border - simple display
  return (
    <Box flexDirection="column" marginY={1}>
      {title && (
        <Box marginBottom={1}>
          <Text bold color={borderColor}>
            📊 {title}
          </Text>
        </Box>
      )}
      <Text>{ascii}</Text>
    </Box>
  );
};

/**
 * Props for the MermaidCodeBlock component
 */
interface MermaidCodeBlockProps {
  /** The Mermaid code to display */
  code: string;
  /** Optional title */
  title?: string;
}

/**
 * MermaidCodeBlock - Display raw Mermaid code as a code block
 * 
 * Used as a fallback when ASCII rendering is not available
 */
export const MermaidCodeBlock: React.FC<MermaidCodeBlockProps> = ({
  code,
  title,
}) => {
  return (
    <Box flexDirection="column" marginY={1}>
      {title && (
        <Box marginBottom={1}>
          <Text bold color="gray">
            {title}
          </Text>
        </Box>
      )}
      <Box
        flexDirection="column"
        borderStyle="single"
        borderColor="gray"
        paddingX={1}
      >
        <Text color="gray" dimColor>
          ```mermaid
        </Text>
        <Text>{code}</Text>
        <Text color="gray" dimColor>
          ```
        </Text>
      </Box>
    </Box>
  );
};

export default DiagramDisplay;
