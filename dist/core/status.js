import { EventEmitter } from "events";
const emitter = new EventEmitter();
emitter.setMaxListeners(20); // Set a reasonable limit to avoid memory leak warnings
let currentStatus = { phase: "idle", message: "" };
export function emitStatus(status) {
    const next = typeof status === "string"
        ? { phase: currentStatus.phase, message: status }
        : status;
    currentStatus = next;
    emitter.emit("status", currentStatus);
}
export function getStatus() {
    return currentStatus;
}
export function onStatus(listener) {
    emitter.on("status", listener);
    return () => emitter.off("status", listener);
}
