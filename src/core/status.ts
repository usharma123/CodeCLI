import { EventEmitter } from "events";
import { SeverityLevel } from "./severity.js";

export type AgentStatusPhase =
  | "idle"
  | "thinking"
  | "running_tools"
  | "summarizing"
  | "waiting_approval";

export interface AgentStatus {
  phase: AgentStatusPhase;
  message: string;
  severity?: SeverityLevel;  // Optional severity level
  agentId?: string;  // Optional for backward compatibility
  agentType?: string;  // Optional agent type
}

const emitter = new EventEmitter();
emitter.setMaxListeners(20); // Set a reasonable limit to avoid memory leak warnings
let currentStatus: AgentStatus = { phase: "idle", message: "" };

export function emitStatus(status: AgentStatus | string, agentId?: string, agentType?: string): void {
  const next =
    typeof status === "string"
      ? { phase: currentStatus.phase, message: status, agentId, agentType }
      : { ...status, agentId: status.agentId || agentId, agentType: status.agentType || agentType };
  currentStatus = next;
  emitter.emit("status", currentStatus);

  // Also emit to agent-specific event if agentId present
  if (next.agentId) {
    emitter.emit(`status:${next.agentId}`, currentStatus);
  }
}

export function getStatus(): AgentStatus {
  return currentStatus;
}

export function onStatus(listener: (status: AgentStatus) => void): () => void {
  emitter.on("status", listener);
  return () => emitter.off("status", listener);
}

