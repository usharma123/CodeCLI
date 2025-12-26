/**
 * LSPDiagnosticsStateManager - Manages LSP diagnostics state
 *
 * Single Responsibility: Collect and expose diagnostics from language servers
 * Follows the same pattern as TodoStateManager
 */

import { emitStatus } from "../status.js";
import type {
  Diagnostic,
  DiagnosticsState,
  DiagnosticSeverity,
  LSPLanguage,
  ServerStatus,
} from "./types.js";

export interface ILSPDiagnosticsStateManager {
  getState(): DiagnosticsState;
  updateDiagnostics(filePath: string, diagnostics: Diagnostic[]): void;
  getDiagnosticsForFile(filePath: string): Diagnostic[];
  getAllDiagnostics(): Diagnostic[];
  getErrorCount(): number;
  clearDiagnosticsForFile(filePath: string): void;
  clearAll(): void;
  updateServerStatus(language: LSPLanguage, status: ServerStatus): void;
  formatForAgent(options?: FormatOptions): string;
}

export interface FormatOptions {
  limit?: number;
  severityFilter?: DiagnosticSeverity[];
  fileFilter?: string;
}

export class LSPDiagnosticsStateManager implements ILSPDiagnosticsStateManager {
  private state: DiagnosticsState;

  constructor() {
    this.state = {
      diagnostics: new Map(),
      lastUpdated: 0,
      serverStatuses: new Map(),
    };
  }

  /**
   * Get the complete diagnostics state
   */
  getState(): DiagnosticsState {
    return this.state;
  }

  /**
   * Update diagnostics for a specific file
   */
  updateDiagnostics(filePath: string, diagnostics: Diagnostic[]): void {
    if (diagnostics.length === 0) {
      this.state.diagnostics.delete(filePath);
    } else {
      this.state.diagnostics.set(filePath, diagnostics);
    }
    this.state.lastUpdated = Date.now();

    // Emit status for UI updates if there are errors
    const errorCount = this.getErrorCount();
    if (errorCount > 0) {
      emitStatus({
        phase: "idle",
        message: `LSP: ${errorCount} error(s) detected`,
      });
    }
  }

  /**
   * Get diagnostics for a specific file
   */
  getDiagnosticsForFile(filePath: string): Diagnostic[] {
    return this.state.diagnostics.get(filePath) || [];
  }

  /**
   * Get all diagnostics across all files
   */
  getAllDiagnostics(): Diagnostic[] {
    const all: Diagnostic[] = [];
    for (const diags of this.state.diagnostics.values()) {
      all.push(...diags);
    }
    return all;
  }

  /**
   * Get count of error-level diagnostics
   */
  getErrorCount(): number {
    return this.getAllDiagnostics().filter((d) => d.severity === "error").length;
  }

  /**
   * Get count of warning-level diagnostics
   */
  getWarningCount(): number {
    return this.getAllDiagnostics().filter((d) => d.severity === "warning").length;
  }

  /**
   * Clear diagnostics for a specific file
   */
  clearDiagnosticsForFile(filePath: string): void {
    this.state.diagnostics.delete(filePath);
    this.state.lastUpdated = Date.now();
  }

  /**
   * Clear all diagnostics
   */
  clearAll(): void {
    this.state.diagnostics.clear();
    this.state.lastUpdated = Date.now();
  }

  /**
   * Update server status for a language
   */
  updateServerStatus(language: LSPLanguage, status: ServerStatus): void {
    this.state.serverStatuses.set(language, status);
  }

  /**
   * Get all server statuses
   */
  getAllServerStatuses(): ServerStatus[] {
    return Array.from(this.state.serverStatuses.values());
  }

  /**
   * Format diagnostics for AI agent consumption
   */
  formatForAgent(options: FormatOptions = {}): string {
    let diagnostics = this.getAllDiagnostics();

    // Apply file filter
    if (options.fileFilter) {
      diagnostics = diagnostics.filter((d) => d.file === options.fileFilter);
    }

    // Apply severity filter
    if (options.severityFilter && options.severityFilter.length > 0) {
      diagnostics = diagnostics.filter((d) =>
        options.severityFilter!.includes(d.severity)
      );
    }

    // Sort by severity (errors first) then by file
    diagnostics.sort((a, b) => {
      const severityOrder = { error: 0, warning: 1, information: 2, hint: 3 };
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return a.file.localeCompare(b.file);
    });

    // Apply limit
    if (options.limit && options.limit > 0) {
      diagnostics = diagnostics.slice(0, options.limit);
    }

    if (diagnostics.length === 0) {
      return "No diagnostics found. Code appears clean.";
    }

    const lines: string[] = [];
    const errorCount = diagnostics.filter((d) => d.severity === "error").length;
    const warningCount = diagnostics.filter((d) => d.severity === "warning").length;

    lines.push(`Found ${diagnostics.length} diagnostic(s): ${errorCount} error(s), ${warningCount} warning(s)\n`);

    for (const d of diagnostics) {
      const loc = `${d.file}:${d.range.start.line + 1}:${d.range.start.character + 1}`;
      const severityTag = d.severity.toUpperCase();
      const codeInfo = d.code ? ` [${d.code}]` : "";
      lines.push(`[${severityTag}] ${loc}${codeInfo}`);
      lines.push(`  ${d.message}`);
      if (d.source) {
        lines.push(`  Source: ${d.source}`);
      }
      lines.push("");
    }

    return lines.join("\n").trim();
  }

  /**
   * Format server statuses for display
   */
  formatServerStatuses(): string {
    const statuses = this.getAllServerStatuses();

    if (statuses.length === 0) {
      return "No language servers have been started yet.";
    }

    const lines: string[] = ["Language Server Status:"];

    for (const s of statuses) {
      const icon =
        s.status === "running"
          ? "✓"
          : s.status === "error"
            ? "✗"
            : s.status === "starting"
              ? "○"
              : "•";

      let line = `  ${icon} ${s.language}: ${s.status}`;
      if (s.pid) {
        line += ` (PID: ${s.pid})`;
      }
      if (s.error) {
        line += ` - ${s.error}`;
      }
      lines.push(line);
    }

    return lines.join("\n");
  }
}
