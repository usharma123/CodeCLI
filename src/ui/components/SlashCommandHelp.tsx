import React from "react";
import { Box, Text } from "ink";
import type { SlashCommand } from "../../core/slash-commands.js";
import { icons } from "../theme.js";

interface SlashCommandHelpProps {
  commands: SlashCommand[];
  filter?: string;
}

// Category labels (no emojis)
const categoryLabels: Record<string, string> = {
  testing: "test",
  analysis: "analyze",
  files: "files",
  session: "session",
  custom: "custom",
};

// Category colors (subtle)
const categoryColors: Record<string, "cyan" | "blue" | "green" | "yellow" | "gray"> = {
  testing: "green",
  analysis: "cyan",
  files: "yellow",
  session: "blue",
  custom: "gray",
};

export function SlashCommandHelp({ commands, filter }: SlashCommandHelpProps) {
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
      borderStyle="single"
      borderColor="gray"
      paddingX={1}
      marginBottom={1}
    >
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color="white">
          commands
        </Text>
        {filter && (
          <Text dimColor>
            {" "}
            {icons.arrow} {filter}
          </Text>
        )}
        <Box flexGrow={1} />
        <Text dimColor>
          tab complete {icons.bullet} enter run
        </Text>
      </Box>

      {!hasCommands && (
        <Text dimColor>no matches</Text>
      )}

      {/* Commands by category */}
      {Object.entries(categories).map(([category, cmds]) => {
        if (cmds.length === 0) return null;

        const catLabel = categoryLabels[category] || category;
        const catColor = categoryColors[category] || "gray";

        return (
          <Box key={category} flexDirection="column" marginBottom={1}>
            <Box>
              <Text color={catColor} dimColor>
                [{catLabel}]
              </Text>
            </Box>

            {cmds.map((cmd) => (
              <CommandItem
                key={cmd.name}
                command={cmd}
                filter={filter}
                categoryColor={catColor}
              />
            ))}
          </Box>
        );
      })}

      {/* Footer */}
      <Box marginTop={1}>
        <Text dimColor>
          esc cancel
        </Text>
      </Box>
    </Box>
  );
}

interface CommandItemProps {
  command: SlashCommand;
  filter?: string;
  categoryColor: "cyan" | "blue" | "green" | "yellow" | "gray";
}

function CommandItem({ command, filter, categoryColor }: CommandItemProps) {
  const aliases =
    command.aliases.length > 0
      ? ` (${command.aliases.map((a) => "/" + a).join(", ")})`
      : "";
  const params = command.parameterized ? " <arg>" : "";

  const searchTerm = filter?.toLowerCase().replace("/", "") || "";
  const nameMatches = searchTerm.length > 0 && command.name.toLowerCase().includes(searchTerm);

  return (
    <Box marginLeft={2}>
      <Box minWidth={18}>
        <Text color={nameMatches ? "white" : categoryColor}>
          /{command.name}
        </Text>
        <Text dimColor>
          {params}
        </Text>
        <Text dimColor>{aliases}</Text>
      </Box>
      <Text dimColor> {icons.dash} </Text>
      <Text dimColor wrap="truncate">{command.description}</Text>
    </Box>
  );
}

// Compact command list
interface CompactCommandListProps {
  commands: SlashCommand[];
  maxShow?: number;
}

export function CompactCommandList({ commands, maxShow = 5 }: CompactCommandListProps) {
  const displayCommands = commands.slice(0, maxShow);
  const remaining = commands.length - maxShow;

  return (
    <Box>
      {displayCommands.map((cmd, i) => (
        <React.Fragment key={cmd.name}>
          <Text dimColor>/{cmd.name}</Text>
          {i < displayCommands.length - 1 && <Text dimColor> {icons.bullet} </Text>}
        </React.Fragment>
      ))}
      {remaining > 0 && (
        <Text dimColor> +{remaining}</Text>
      )}
    </Box>
  );
}
