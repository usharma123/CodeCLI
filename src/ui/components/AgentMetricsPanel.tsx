import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import {
  onAgentMetrics,
  onAgentTask,
  AgentMetricsEvent,
  AgentTaskEvent,
} from "../../core/agent-events.js";
import { getAgentManager } from "../../core/agent-manager.js";

interface AgentMetrics {
  agentId: string;
  agentType: string;
  totalTasks: number;
  successfulTasks: number;
  failedTasks: number;
  averageDuration: number;
  totalDuration: number;
  totalToolCalls: number;
  totalTokensUsed: number;
  lastUpdated: number;
}

/**
 * AgentMetricsPanel - Performance metrics dashboard
 * Shows real-time statistics for each agent
 * Toggle with Ctrl+M
 */
export function AgentMetricsPanel() {
  const [metrics, setMetrics] = useState<Map<string, AgentMetrics>>(new Map());
  const [managerStats, setManagerStats] = useState({
    registeredAgents: 0,
    activeDelegations: 0,
  });

  useEffect(() => {
    // Subscribe to metrics updates
    const unsubscribeMetrics = onAgentMetrics((event: AgentMetricsEvent) => {
      setMetrics((prev) => {
        const next = new Map(prev);
        const metric: AgentMetrics = {
          agentId: event.agentId,
          agentType: event.agentType,
          ...event.metrics,
          lastUpdated: event.timestamp,
        };
        next.set(event.agentId, metric);
        return next;
      });
    });

    // Subscribe to task events to update metrics in real-time
    const unsubscribeTask = onAgentTask((event: AgentTaskEvent) => {
      setMetrics((prev) => {
        const next = new Map(prev);
        const existing = next.get(event.agentId);
        const metric: AgentMetrics = existing || {
          agentId: event.agentId,
          agentType: event.agentType,
          totalTasks: 0,
          successfulTasks: 0,
          failedTasks: 0,
          averageDuration: 0,
          totalDuration: 0,
          totalToolCalls: 0,
          totalTokensUsed: 0,
          lastUpdated: Date.now(),
        };

        if (event.type === "completed") {
          metric.totalTasks++;
          if (event.result?.status === "success") {
            metric.successfulTasks++;
          } else if (event.result?.status === "error") {
            metric.failedTasks++;
          }

          if (event.metrics?.duration) {
            metric.totalDuration += event.metrics.duration;
            metric.averageDuration = metric.totalDuration / metric.totalTasks;
          }

          if (event.metrics?.toolCallCount) {
            metric.totalToolCalls += event.metrics.toolCallCount;
          }

          if (event.metrics?.tokensUsed) {
            metric.totalTokensUsed += event.metrics.tokensUsed;
          }

          metric.lastUpdated = Date.now();
        }

        next.set(event.agentId, metric);
        return next;
      });
    });

    // Update manager stats periodically
    const interval = setInterval(() => {
      try {
        const agentManager = getAgentManager();
        const stats = agentManager.getStats();
        setManagerStats(stats);
      } catch (err) {
        // Ignore errors
      }
    }, 1000);

    return () => {
      unsubscribeMetrics();
      unsubscribeTask();
      clearInterval(interval);
    };
  }, []);

  const agentMetrics = Array.from(metrics.values());

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="magenta"
      paddingX={1}
      width={40}
    >
      <Text bold color="magenta">
        Agent Metrics
      </Text>

      {/* Manager Stats */}
      <Box marginTop={1} borderBottom borderColor="gray">
        <Box flexDirection="column">
          <Text dimColor>System Status:</Text>
          <Text>
            Agents: <Text color="cyan">{managerStats.registeredAgents}</Text>
          </Text>
          <Text>
            Active: <Text color="yellow">{managerStats.activeDelegations}</Text>
          </Text>
        </Box>
      </Box>

      {/* Agent Metrics */}
      {agentMetrics.length === 0 ? (
        <Box marginTop={1}>
          <Text dimColor>No agent metrics yet</Text>
        </Box>
      ) : (
        <Box flexDirection="column" marginTop={1}>
          {agentMetrics.map((metric) => (
            <AgentMetricItem key={metric.agentId} metric={metric} />
          ))}
        </Box>
      )}

      {/* Summary */}
      {agentMetrics.length > 0 && (
        <Box marginTop={1} borderTop borderColor="gray">
          <Box flexDirection="column">
            <Text dimColor>Total:</Text>
            <Text>
              Tasks:{" "}
              <Text color="green">
                {agentMetrics.reduce((sum, m) => sum + m.totalTasks, 0)}
              </Text>
            </Text>
            <Text>
              Success:{" "}
              <Text color="green">
                {agentMetrics.reduce((sum, m) => sum + m.successfulTasks, 0)}
              </Text>
            </Text>
            <Text>
              Failed:{" "}
              <Text color="red">
                {agentMetrics.reduce((sum, m) => sum + m.failedTasks, 0)}
              </Text>
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );
}

interface AgentMetricItemProps {
  metric: AgentMetrics;
}

function AgentMetricItem({ metric }: AgentMetricItemProps) {
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
      default:
        return "🤖";
    }
  };

  const successRate =
    metric.totalTasks > 0
      ? ((metric.successfulTasks / metric.totalTasks) * 100).toFixed(0)
      : "0";

  const avgDurationMs = metric.averageDuration.toFixed(0);

  return (
    <Box flexDirection="column" marginY={0}>
      <Box>
        <Text>
          {getAgentIcon(metric.agentType)} <Text bold>{metric.agentType}</Text>
        </Text>
      </Box>
      <Box marginLeft={2} flexDirection="column">
        <Text dimColor>
          Tasks: {metric.totalTasks} ({successRate}% success)
        </Text>
        <Text dimColor>Avg time: {avgDurationMs}ms</Text>
        {metric.totalToolCalls > 0 && (
          <Text dimColor>Tool calls: {metric.totalToolCalls}</Text>
        )}
      </Box>
    </Box>
  );
}
