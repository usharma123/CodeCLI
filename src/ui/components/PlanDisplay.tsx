import React from "react";
import { Box, Text } from "ink";
import { icons } from "../theme.js";
import type { Plan } from "../../core/types.js";

interface PlanDisplayProps {
  plan: Plan;
}

export function PlanDisplay({ plan }: PlanDisplayProps) {
  return (
    <Box flexDirection="column" marginBottom={1}>
      {/* Summary */}
      <Box marginBottom={1}>
        <Text>{plan.summary}</Text>
      </Box>

      {/* Sections */}
      {plan.sections.map((section, sectionIndex) => (
        <Box
          key={sectionIndex}
          flexDirection="column"
          borderStyle="single"
          borderColor="gray"
          paddingX={1}
          marginBottom={1}
        >
          {/* Section header */}
          <Box marginBottom={1}>
            <Text color="cyan" bold>
              {icons.section} {section.title}
            </Text>
          </Box>

          {/* Section description */}
          <Box marginBottom={1}>
            <Text dimColor>{section.description}</Text>
          </Box>

          {/* Tasks */}
          <Box flexDirection="column" marginBottom={section.files?.length ? 1 : 0}>
            {section.tasks.map((task, taskIndex) => (
              <Box key={taskIndex}>
                <Text dimColor>{icons.bullet} </Text>
                <Text>{task}</Text>
              </Box>
            ))}
          </Box>

          {/* Files */}
          {section.files && section.files.length > 0 && (
            <Box>
              <Text dimColor>Files: </Text>
              <Text color="blue">{section.files.join(", ")}</Text>
            </Box>
          )}
        </Box>
      ))}

      {/* Risks */}
      {plan.risks && plan.risks.length > 0 && (
        <Box flexDirection="column" marginBottom={1}>
          <Text color="yellow" bold>
            {icons.warning} Considerations
          </Text>
          {plan.risks.map((risk, i) => (
            <Box key={i}>
              <Text dimColor>  {icons.bullet} </Text>
              <Text>{risk}</Text>
            </Box>
          ))}
        </Box>
      )}

      {/* Alternatives */}
      {plan.alternatives && plan.alternatives.length > 0 && (
        <Box flexDirection="column">
          <Text color="gray" bold>
            {icons.info} Alternatives considered
          </Text>
          {plan.alternatives.map((alt, i) => (
            <Box key={i}>
              <Text dimColor>  {icons.bullet} </Text>
              <Text dimColor>{alt}</Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
