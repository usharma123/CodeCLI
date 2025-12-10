import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

interface ConfirmProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function Confirm({ message, onConfirm, onCancel }: ConfirmProps) {
  const [selected, setSelected] = useState<'yes' | 'no'>('yes');

  useInput((input, key) => {
    // Arrow keys or h/l to toggle
    if (key.leftArrow || key.rightArrow || input === 'h' || input === 'l') {
      setSelected(prev => prev === 'yes' ? 'no' : 'yes');
    }
    // Enter to confirm selection
    if (key.return) {
      if (selected === 'yes') {
        onConfirm();
      } else {
        onCancel();
      }
    }
    // Quick shortcuts: y for yes, n for no
    if (input === 'y' || input === 'Y') {
      onConfirm();
    }
    if (input === 'n' || input === 'N') {
      onCancel();
    }
  });

  return (
    <Box>
      <Text color="yellow">{message} </Text>
      <Text color={selected === 'yes' ? 'green' : 'gray'}>
        {selected === 'yes' ? '▸ ' : '  '}
        <Text bold={selected === 'yes'} inverse={selected === 'yes'}> Yes </Text>
      </Text>
      <Text> </Text>
      <Text color={selected === 'no' ? 'red' : 'gray'}>
        {selected === 'no' ? '▸ ' : '  '}
        <Text bold={selected === 'no'} inverse={selected === 'no'}> No </Text>
      </Text>
      <Text dimColor>  ←/→ to select, Enter to confirm</Text>
    </Box>
  );
}
