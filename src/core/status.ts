import { EventEmitter } from "events";

export type AgentStatusPhase =
  | "idle"
  | "thinking"
  | "running_tools"
  | "summarizing"
  | "waiting_approval";

export interface AgentStatus {
  phase: AgentStatusPhase;
  message: string;
}

const emitter = new EventEmitter();
let currentStatus: AgentStatus = { phase: "idle", message: "" };

export function emitStatus(status: AgentStatus | string): void {
  const next =
    typeof status === "string"
      ? { phase: currentStatus.phase, message: status }
      : status;
  currentStatus = next;
  emitter.emit("status", currentStatus);
}

export function getStatus(): AgentStatus {
  return currentStatus;
}

export function onStatus(listener: (status: AgentStatus) => void): () => void {
  emitter.on("status", listener);
  return () => emitter.off("status", listener);
}

