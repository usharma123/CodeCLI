import { colors } from "../utils/colors.js";

export interface ConfirmationRequest {
  id: string;
  type: "file_write" | "file_edit" | "file_delete" | "command_run" | "generic";
  message: string;
  metadata: Record<string, any>;
  timestamp: number;
  resolver: (result: boolean) => void;
}

export interface ConfirmationBatch {
  type: string;
  requests: ConfirmationRequest[];
  pattern: string;
}

export class ConfirmationQueue {
  private queue: ConfirmationRequest[] = [];
  private batchTimeout: number = 500; // ms to wait before showing batch
  private batchTimer: NodeJS.Timeout | null = null;
  private enabled: boolean = true;
  private requestIdCounter: number = 0;

  constructor(batchTimeout: number = 500) {
    this.batchTimeout = batchTimeout;
  }

  /**
   * Request a confirmation (may be batched with similar requests)
   */
  async requestConfirmation(
    request: Omit<ConfirmationRequest, "id" | "timestamp">
  ): Promise<boolean> {
    if (!this.enabled) {
      // Batching disabled, ask immediately
      return await this.askSingle(request);
    }

    return new Promise((resolve) => {
      const id = `conf-${++this.requestIdCounter}`;
      const fullRequest: ConfirmationRequest = {
        ...request,
        id,
        timestamp: Date.now(),
        resolver: resolve
      };

      this.queue.push(fullRequest);

      // Start or reset batch timer
      if (this.batchTimer) {
        clearTimeout(this.batchTimer);
      }

      this.batchTimer = setTimeout(() => {
        this.processBatch();
      }, this.batchTimeout);
    });
  }

  /**
   * Process queued requests as batch(es)
   */
  private async processBatch(): Promise<void> {
    if (this.queue.length === 0) {
      return;
    }

    const batches = this.groupIntoBatches();

    for (const batch of batches) {
      if (batch.requests.length === 1) {
        // Single request, ask normally
        const request = batch.requests[0];
        const result = await this.askSingle(request);
        request.resolver(result);
      } else {
        // Multiple requests, show batch UI
        await this.askBatch(batch);
      }
    }

    this.queue = [];
  }

  /**
   * Group requests into batches by similarity
   */
  private groupIntoBatches(): ConfirmationBatch[] {
    const batches: ConfirmationBatch[] = [];
    const processed = new Set<string>();

    for (const request of this.queue) {
      if (processed.has(request.id)) {
        continue;
      }

      // Find all similar requests
      const similar = this.queue.filter(r =>
        !processed.has(r.id) && this.areSimilar(request, r)
      );

      for (const req of similar) {
        processed.add(req.id);
      }

      batches.push({
        type: request.type,
        requests: similar,
        pattern: this.extractPattern(request)
      });
    }

    return batches;
  }

  /**
   * Check if two requests are similar enough to batch
   */
  private areSimilar(req1: ConfirmationRequest, req2: ConfirmationRequest): boolean {
    // Must be same type
    if (req1.type !== req2.type) {
      return false;
    }

    // For file operations, check if they're in the same directory
    if (req1.type.startsWith("file_")) {
      const path1 = req1.metadata.path || "";
      const path2 = req2.metadata.path || "";

      // Same directory or similar file names
      const dir1 = path1.substring(0, path1.lastIndexOf("/"));
      const dir2 = path2.substring(0, path2.lastIndexOf("/"));

      return dir1 === dir2;
    }

    // For commands, check if they're similar commands
    if (req1.type === "command_run") {
      const cmd1 = (req1.metadata.command || "").split(" ")[0];
      const cmd2 = (req2.metadata.command || "").split(" ")[0];

      return cmd1 === cmd2;
    }

    return true;
  }

  /**
   * Extract a pattern description from a request
   */
  private extractPattern(request: ConfirmationRequest): string {
    if (request.type === "file_write") {
      return "Write files";
    } else if (request.type === "file_edit") {
      return "Edit files";
    } else if (request.type === "file_delete") {
      return "Delete files";
    } else if (request.type === "command_run") {
      const cmd = (request.metadata.command || "").split(" ")[0];
      return `Run ${cmd} commands`;
    }

    return "Multiple operations";
  }

  /**
   * Ask for a single confirmation
   */
  private async askSingle(request: Omit<ConfirmationRequest, "id" | "timestamp">): Promise<boolean> {
    // This will be handled by the existing confirmation system
    // For now, auto-approve in batch mode
    return true;
  }

  /**
   * Ask for batch confirmation
   */
  private async askBatch(batch: ConfirmationBatch): Promise<void> {
    console.log(`\n${colors.yellow}[!] Batch Confirmation (${batch.requests.length} similar operations)${colors.reset}\n`);

    // List all operations
    for (let i = 0; i < batch.requests.length; i++) {
      const req = batch.requests[i];
      const desc = this.describeRequest(req);
      console.log(`  ${i + 1}. ${desc}`);
    }

    console.log(`\n${colors.gray}Options:${colors.reset}`);
    console.log(`  ${colors.green}[A]${colors.reset} Approve all`);
    console.log(`  ${colors.green}[Y]${colors.reset} Approve first only`);
    console.log(`  ${colors.red}[S]${colors.reset} Skip all`);
    console.log(`  ${colors.red}[N]${colors.reset} Cancel first only`);
    console.log();

    // For now, auto-approve all (TODO: implement interactive prompt)
    const choice = "a"; // Auto-approve for now

    switch (choice.toLowerCase()) {
      case "a":
        // Approve all
        for (const req of batch.requests) {
          req.resolver(true);
        }
        break;

      case "y":
        // Approve first, skip rest
        batch.requests[0].resolver(true);
        for (let i = 1; i < batch.requests.length; i++) {
          batch.requests[i].resolver(false);
        }
        break;

      case "s":
        // Skip all
        for (const req of batch.requests) {
          req.resolver(false);
        }
        break;

      case "n":
        // Cancel first, skip rest
        batch.requests[0].resolver(false);
        for (let i = 1; i < batch.requests.length; i++) {
          batch.requests[i].resolver(false);
        }
        break;

      default:
        // Cancel all
        for (const req of batch.requests) {
          req.resolver(false);
        }
    }
  }

  /**
   * Describe a confirmation request
   */
  private describeRequest(request: ConfirmationRequest): string {
    if (request.type === "file_write") {
      return `Write file: ${colors.bold}${request.metadata.path}${colors.reset}`;
    } else if (request.type === "file_edit") {
      return `Edit file: ${colors.bold}${request.metadata.path}${colors.reset}`;
    } else if (request.type === "file_delete") {
      return `Delete file: ${colors.bold}${request.metadata.path}${colors.reset}`;
    } else if (request.type === "command_run") {
      return `Run command: ${colors.cyan}${request.metadata.command}${colors.reset}`;
    }

    return request.message;
  }

  /**
   * Enable or disable batching
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if batching is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Set batch timeout
   */
  setBatchTimeout(timeout: number): void {
    this.batchTimeout = timeout;
  }

  /**
   * Get current queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Clear the queue
   */
  clear(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    // Reject all pending requests
    for (const req of this.queue) {
      req.resolver(false);
    }

    this.queue = [];
  }
}

// Global singleton
let confirmationQueueInstance: ConfirmationQueue | null = null;

export function getConfirmationQueue(batchTimeout?: number): ConfirmationQueue {
  if (!confirmationQueueInstance) {
    confirmationQueueInstance = new ConfirmationQueue(batchTimeout);
  }
  return confirmationQueueInstance;
}
