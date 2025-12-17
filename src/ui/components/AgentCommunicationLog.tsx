import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import {
  onAgentCommunication,
  AgentCommunicationEvent,
  getAgentEvents,
} from "../../core/agent-events.js";

/**
 * AgentCommunicationLog - Shows inter-agent communication
 * Displays delegation requests and results between agents
 * Useful for debugging and understanding agent workflows
 */
export function AgentCommunicationLog() {
  const [communications, setCommunications] = useState<AgentCommunicationEvent[]>([]);
  const [maxEntries] = useState(10); // Show last 10 communications

  useEffect(() => {
    // Load initial history
    const agentEvents = getAgentEvents();
    const history = agentEvents.getCommunicationHistory(maxEntries);
    setCommunications(history);

    // Subscribe to new communications
    const unsubscribe = onAgentCommunication((event: AgentCommunicationEvent) => {
      setCommunications((prev) => {
        const next = [...prev, event];
        if (next.length > maxEntries) {
          return next.slice(-maxEntries); // Keep last N
        }
        return next;
      });
    });

    return unsubscribe;
  }, [maxEntries]);

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="blue"
      paddingX={1}
      width={50}
    >
      <Text bold color="blue">
        Agent Communication Log
      </Text>

      {communications.length === 0 ? (
        <Box marginTop={1}>
          <Text dimColor>No inter-agent communications yet</Text>
        </Box>
      ) : (
        <Box flexDirection="column" marginTop={1}>
          {communications.map((comm, idx) => (
            <CommunicationItem key={idx} communication={comm} />
          ))}
        </Box>
      )}

      <Box marginTop={1} borderTop borderColor="gray">
        <Text dimColor>
          Showing last {Math.min(communications.length, maxEntries)} messages
        </Text>
      </Box>
    </Box>
  );
}

interface CommunicationItemProps {
  communication: AgentCommunicationEvent;
}

function CommunicationItem({ communication }: CommunicationItemProps) {
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

  const getTypeColor = (type: string): "cyan" | "green" | "yellow" => {
    switch (type) {
      case "delegation":
        return "cyan";
      case "result":
        return "green";
      case "coordination":
        return "yellow";
      default:
        return "cyan";
    }
  };

  const getTypeSymbol = (type: string): string => {
    switch (type) {
      case "delegation":
        return "→";
      case "result":
        return "←";
      case "coordination":
        return "↔";
      default:
        return "•";
    }
  };

  const time = new Date(communication.timestamp).toLocaleTimeString();
  const typeColor = getTypeColor(communication.type);
  const typeSymbol = getTypeSymbol(communication.type);

  return (
    <Box flexDirection="column" marginY={0}>
      <Box>
        <Text dimColor>{time}</Text>
        <Text> </Text>
        <Text>
          {getAgentIcon(communication.fromAgentType)} {communication.fromAgentType}
        </Text>
        <Text> </Text>
        <Text color={typeColor}>{typeSymbol}</Text>
        <Text> </Text>
        <Text>
          {getAgentIcon(communication.toAgentType)} {communication.toAgentType}
        </Text>
      </Box>
      <Box marginLeft={2}>
        <Text dimColor>{communication.message.substring(0, 40)}...</Text>
      </Box>
    </Box>
  );
}
