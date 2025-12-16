import { EventEmitter } from "events";

export interface ToolOutput {
  id: string;
  toolName: string;
  args: any;
  result: string;
  displayedResult: string;
  isTruncated: boolean;
  timestamp: number;
}

class OutputManager extends EventEmitter {
  private outputs: ToolOutput[] = [];
  private maxOutputs: number = 10;
  private nextId: number = 1;

  emitToolOutput(output: Omit<ToolOutput, "id">): string {
    const id = `output_${this.nextId++}`;
    const toolOutput: ToolOutput = { ...output, id };

    // Add to circular buffer
    this.outputs.push(toolOutput);
    if (this.outputs.length > this.maxOutputs) {
      this.outputs.shift(); // Remove oldest
    }

    this.emit("output", toolOutput);
    return id;
  }

  getOutputs(): ToolOutput[] {
    return [...this.outputs];
  }

  getLastTruncatedOutput(): ToolOutput | null {
    // Find the most recent truncated output
    for (let i = this.outputs.length - 1; i >= 0; i--) {
      if (this.outputs[i].isTruncated) {
        return this.outputs[i];
      }
    }
    return null;
  }

  getOutputById(id: string): ToolOutput | null {
    return this.outputs.find((o) => o.id === id) || null;
  }

  clearOutputs(): void {
    this.outputs = [];
    this.emit("cleared");
  }
}

const outputManager = new OutputManager();

export function emitToolOutput(output: Omit<ToolOutput, "id">): string {
  return outputManager.emitToolOutput(output);
}

export function onToolOutput(callback: (output: ToolOutput) => void): () => void {
  outputManager.on("output", callback);
  return () => outputManager.off("output", callback);
}

export function getOutputs(): ToolOutput[] {
  return outputManager.getOutputs();
}

export function getLastTruncatedOutput(): ToolOutput | null {
  return outputManager.getLastTruncatedOutput();
}

export function getOutputById(id: string): ToolOutput | null {
  return outputManager.getOutputById(id);
}

export function clearOutputs(): void {
  outputManager.clearOutputs();
}
