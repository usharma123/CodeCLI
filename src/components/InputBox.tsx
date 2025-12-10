import React from 'react';
import { Box, Text } from 'ink';
import { TextInput } from '@inkjs/ui';

interface InputBoxProps {
  onSubmit: (value: string) => void;
  isDisabled?: boolean;
  sessionNum: number;
}

export function InputBox({ onSubmit, isDisabled = false, sessionNum }: InputBoxProps) {
  return (
    <Box flexDirection="column">
      <Box 
        borderStyle="round" 
        borderColor="cyan" 
        paddingX={1}
      >
        <Text color="gray">→ </Text>
        <TextInput
          placeholder="Plan, search, build anything"
          onSubmit={onSubmit}
          isDisabled={isDisabled}
        />
      </Box>
      <Box paddingLeft={1} gap={1}>
        <Text dimColor>Session {sessionNum}</Text>
        <Text dimColor>/ commands · @ files · ! shell</Text>
      </Box>
    </Box>
  );
}
