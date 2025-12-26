/**
 * LSP Types and Interfaces
 *
 * Type definitions for Language Server Protocol integration
 */

import { EventEmitter } from "events";

// Supported languages for LSP
// Note: csharp, rust, and go are detected but clients not yet implemented
export type LSPLanguage = "typescript" | "javascript" | "python" | "java" | "kotlin" | "csharp" | "rust" | "go";

// Diagnostic severity levels (mirrors LSP spec)
export type DiagnosticSeverity = "error" | "warning" | "information" | "hint";

// Position in a document
export interface Position {
  line: number;
  character: number;
}

// Range in a document
export interface Range {
  start: Position;
  end: Position;
}

// Single diagnostic entry from a language server
export interface Diagnostic {
  file: string;
  range: Range;
  message: string;
  severity: DiagnosticSeverity;
  source: string;
  code?: string | number;
}

// Aggregated diagnostics state
export interface DiagnosticsState {
  diagnostics: Map<string, Diagnostic[]>;
  lastUpdated: number;
  serverStatuses: Map<LSPLanguage, ServerStatus>;
}

// Server status tracking
export type ServerStatusType = "stopped" | "starting" | "running" | "error";

export interface ServerStatus {
  language: LSPLanguage;
  status: ServerStatusType;
  pid?: number;
  error?: string;
  lastActivity?: number;
}

// LSP Client interface
export interface ILSPClient {
  language: LSPLanguage;
  workspaceRoot: string;

  start(): Promise<void>;
  stop(): Promise<void>;
  isRunning(): boolean;
  getStatus(): ServerStatus;

  notifyFileOpened(filePath: string, content: string): Promise<void>;
  notifyFileChanged(filePath: string, content: string): Promise<void>;
  notifyFileClosed(filePath: string): Promise<void>;

  onDiagnostics(callback: (file: string, diagnostics: Diagnostic[]) => void): void;
}

// LSP Installer interface
export interface ILSPInstaller {
  language: LSPLanguage;

  isInstalled(): Promise<boolean>;
  install(): Promise<void>;
  getServerCommand(): Promise<string[]>;
}

// Configuration for LSP feature
export interface LSPConfig {
  enabled: boolean;
  autoInstall: boolean;
  diagnosticsDebounceMs: number;
  serverTimeoutMs: number;
  maxDiagnosticsPerFile: number;
}

// JSON-RPC message types
export interface JsonRpcMessage {
  jsonrpc: "2.0";
}

export interface JsonRpcRequest extends JsonRpcMessage {
  id: number;
  method: string;
  params?: unknown;
}

export interface JsonRpcResponse extends JsonRpcMessage {
  id: number;
  result?: unknown;
  error?: JsonRpcError;
}

export interface JsonRpcNotification extends JsonRpcMessage {
  method: string;
  params?: unknown;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

// Pending request tracking
export interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  method: string;
  startTime: number;
}

// LSP Initialize params (subset)
export interface InitializeParams {
  processId: number;
  rootUri: string;
  capabilities: ClientCapabilities;
  initializationOptions?: unknown;
}

// Client capabilities (subset we support)
export interface ClientCapabilities {
  textDocument?: {
    publishDiagnostics?: {
      relatedInformation?: boolean;
    };
    synchronization?: {
      didSave?: boolean;
      willSave?: boolean;
    };
  };
}

// LSP PublishDiagnostics params
export interface PublishDiagnosticsParams {
  uri: string;
  diagnostics: LSPDiagnostic[];
}

// Raw LSP diagnostic (before conversion)
export interface LSPDiagnostic {
  range: Range;
  message: string;
  severity?: number;
  code?: string | number;
  source?: string;
}

// Tool input types
export interface GetDiagnosticsInput {
  file?: string;
  severity_filter?: DiagnosticSeverity[];
  limit?: number;
}

export interface LSPStatusInput {
  // No parameters
}

// Default LSP configuration
export function getDefaultLSPConfig(): LSPConfig {
  return {
    enabled: true,
    autoInstall: true,
    diagnosticsDebounceMs: 500,
    serverTimeoutMs: 30000,
    maxDiagnosticsPerFile: 100,
  };
}

// Severity conversion from LSP numbers
export function severityFromNumber(severity?: number): DiagnosticSeverity {
  switch (severity) {
    case 1:
      return "error";
    case 2:
      return "warning";
    case 3:
      return "information";
    case 4:
      return "hint";
    default:
      return "error";
  }
}
