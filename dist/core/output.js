import { EventEmitter } from "events";
class OutputManager extends EventEmitter {
    outputs = [];
    maxOutputs = 10;
    nextId = 1;
    emitToolOutput(output) {
        const id = `output_${this.nextId++}`;
        const toolOutput = { ...output, id };
        // Add to circular buffer
        this.outputs.push(toolOutput);
        if (this.outputs.length > this.maxOutputs) {
            this.outputs.shift(); // Remove oldest
        }
        this.emit("output", toolOutput);
        return id;
    }
    getOutputs() {
        return [...this.outputs];
    }
    getLastTruncatedOutput() {
        // Find the most recent truncated output
        for (let i = this.outputs.length - 1; i >= 0; i--) {
            if (this.outputs[i].isTruncated) {
                return this.outputs[i];
            }
        }
        return null;
    }
    getOutputById(id) {
        return this.outputs.find((o) => o.id === id) || null;
    }
    clearOutputs() {
        this.outputs = [];
        this.emit("cleared");
    }
}
const outputManager = new OutputManager();
export function emitToolOutput(output) {
    return outputManager.emitToolOutput(output);
}
export function onToolOutput(callback) {
    outputManager.on("output", callback);
    return () => outputManager.off("output", callback);
}
export function getOutputs() {
    return outputManager.getOutputs();
}
export function getLastTruncatedOutput() {
    return outputManager.getLastTruncatedOutput();
}
export function getOutputById(id) {
    return outputManager.getOutputById(id);
}
export function clearOutputs() {
    outputManager.clearOutputs();
}
