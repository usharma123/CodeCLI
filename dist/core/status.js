import { EventEmitter } from "events";
const emitter = new EventEmitter();
emitter.setMaxListeners(20); // Set a reasonable limit to avoid memory leak warnings
let currentStatus = { phase: "idle", message: "" };
export function emitStatus(status, agentId, agentType) {
    const next = typeof status === "string"
        ? { phase: currentStatus.phase, message: status, agentId, agentType }
        : { ...status, agentId: status.agentId || agentId, agentType: status.agentType || agentType };
    currentStatus = next;
    emitter.emit("status", currentStatus);
    // Also emit to agent-specific event if agentId present
    if (next.agentId) {
        emitter.emit(`status:${next.agentId}`, currentStatus);
    }
}
export function getStatus() {
    return currentStatus;
}
export function onStatus(listener) {
    emitter.on("status", listener);
    return () => emitter.off("status", listener);
}
