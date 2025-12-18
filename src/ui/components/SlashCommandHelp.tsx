import React from "react";
import { Box, Text } from "ink";
import type { SlashCommand } from "../../core/slash-commands.js";

interface SlashCommandHelpProps {
  commands: SlashCommand[];
  filter?: string;
}

export function SlashCommandHelp({ commands, filter }: SlashCommandHelpProps) {
  // Filter commands based on input
  const filteredCommands = filter
    ? commands.filter((cmd) => {
        const searchTerm = filter.toLowerCase().replace("/", "");
        return (
          cmd.name.toLowerCase().includes(searchTerm) ||
          cmd.aliases.some((alias) => alias.toLowerCase().includes(searchTerm)) ||
          cmd.description.toLowerCase().includes(searchTerm)
        );
      })
    : commands;

  // Group by category
  const categories: Record<string, SlashCommand[]> = {
    testing: [],
    analysis: [],
    files: [],
    session: [],
    custom: [],
  };

  const seen = new Set<string>();
  for (const cmd of filteredCommands) {
    if (!seen.has(cmd.name)) {
      seen.add(cmd.name);
      categories[cmd.category].push(cmd);
    }
  }

  const hasCommands = filteredCommands.length > 0;

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="cyan"
      paddingX={1}
      paddingY={0}
      marginBottom={1}
    >
      <Text bold color="cyan">
        Available Commands {filter && `(filtered: "${filter}")`}
      </Text>

      {!hasCommands && (
        <Text color="yellow">No commands match your search</Text>
      )}

      {Object.entries(categories).map(([category, cmds]) => {
        if (cmds.length === 0) return null;

        return (
          <Box key={category} flexDirection="column" marginTop={1}>
            <Text bold color="magenta">
              {category.toUpperCase()}:
            </Text>
            {cmds.map((cmd) => {
              const aliases =
                cmd.aliases.length > 0
                  ? ` (${cmd.aliases.map((a) => "/" + a).join(", ")})`
                  : "";
              const params = cmd.parameterized ? " <arg>" : "";

              return (
                <Box key={cmd.name} marginLeft={2}>
                  <Text color="green">
                    /{cmd.name}
                    {params}
                  </Text>
                  <Text color="gray">{aliases}</Text>
                  <Text> - </Text>
                  <Text>{cmd.description}</Text>
                </Box>
              );
            })}
          </Box>
        );
      })}

      <Box marginTop={1}>
        <Text dimColor>
          Type a command name or press Ctrl+C to cancel
        </Text>
      </Box>
    </Box>
  );
}
