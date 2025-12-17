import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { onAgentStatus, onAgentTask, AgentStatusEvent, AgentTaskEvent } from "../../core/agent-events.js";

interface AgentActivity {
  agentId: string;
  agentType: string;
  status: AgentStatusEvent;
  lastTask?: AgentTaskEvent;
  taskCount: number;
}

/**
 * AgentActivityPanel - Shows real-time multi-agent activity
 * Displays in right sidebar (40 columns), toggle with Ctrl+A
 */
export function AgentActivityPanel() {
  const [activities, setActivities] = useState<Map<string, AgentActivity>>(new Map());

  useEffect(() => {
    // Subscribe to status updates
    const unsubscribeStatus = onAgentStatus((event: AgentStatusEvent) => {
      setActivities((prev) => {
        const next = new Map(prev);
        const activity = next.get(event.agentId) || {
          agentId: event.agentId,
          agentType: event.agentType,
          status: event,
          taskCount: 0,
        };
        activity.status = event;
        next.set(event.agentId, activity);
        return next;
      });
    });

    // Subscribe to task updates
    const unsubscribeTask = onAgentTask((event: AgentTaskEvent) => {
      setActivities((prev) => {
        const next = new Map(prev);
        const activity = next.get(event.agentId);
        if (activity) {
          activity.lastTask = event;
          if (event.type === "completed" || event.type === "failed") {
            activity.taskCount++;
          }
          next.set(event.agentId, activity);
        }
        return next;
      });
    });

    return () => {
      unsubscribeStatus();
      unsubscribeTask();
    };
  }, []);

  const activeAgents = Array.from(activities.values()).filter(
    (a) => a.status.phase !== "idle"
  );

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="cyan"
      paddingX={1}
      width={40}
    >
      <Text bold color="cyan">
        Agent Activity
      </Text>

      {activeAgents.length === 0 ? (
        <Box marginTop={1}>
          <Text dimColor>No active agents</Text>
        </Box>
      ) : (
        <Box flexDirection="column" marginTop={1}>
          {activeAgents.map((activity) => (
            <AgentActivityItem key={activity.agentId} activity={activity} />
          ))}
        </Box>
      )}

      {activities.size > 0 && (
        <Box marginTop={1} borderTop borderColor="gray">
          <Text dimColor>
            {activities.size} agent{activities.size !== 1 ? "s" : ""} registered
          </Text>
        </Box>
      )}
    </Box>
  );
}

interface AgentActivityItemProps {
  activity: AgentActivity;
}

function AgentActivityItem({ activity }: AgentActivityItemProps) {
  const getStatusColor = (
    phase: string
  ): "green" | "yellow" | "red" | "gray" | "cyan" => {
    switch (phase) {
      case "thinking":
        return "yellow";
      case "running_tools":
        return "cyan";
      case "completed":
        return "green";
      case "error":
        return "red";
      default:
        return "gray";
    }
  };

  const getAgentIcon = (type: string): string => {
    switch (type) {
      case "filesystem":
        return "📁";
      case "testing":
        return "🧪";
      case "build":
        return "⚙️";
      case "analysis":
        return "🔍";
      case "orchestrator":
        return "🎯";
      default:
        return "🤖";
    }
  };

  const getPhaseSymbol = (phase: string): string => {
    switch (phase) {
      case "thinking":
        return "💭";
      case "running_tools":
        return "⚡";
      case "completed":
        return "✅";
      case "error":
        return "❌";
      case "waiting_approval":
        return "⏸️";
      default:
        return "•";
    }
  };

  const statusColor = getStatusColor(activity.status.phase);
  const agentIcon = getAgentIcon(activity.agentType);
  const phaseSymbol = getPhaseSymbol(activity.status.phase);

  return (
    <Box flexDirection="column" marginY={0}>
      <Box>
        <Text>
          {agentIcon} <Text bold>{activity.agentType}</Text>
        </Text>
      </Box>
      <Box marginLeft={2}>
        <Text color={statusColor}>
          {phaseSymbol} {activity.status.message}
        </Text>
      </Box>
      {activity.taskCount > 0 && (
        <Box marginLeft={2}>
          <Text dimColor>
            {activity.taskCount} task{activity.taskCount !== 1 ? "s" : ""} completed
          </Text>
        </Box>
      )}
    </Box>
  );
}
