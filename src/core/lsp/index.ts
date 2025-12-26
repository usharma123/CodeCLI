/**
 * LSP Module - Language Server Protocol support
 *
 * Public exports for LSP functionality
 */

// Manager
export {
  LSPClientManager,
  getLSPClientManager,
  initializeLSP,
  shutdownLSP,
} from "./LSPClientManager.js";

// State
export { LSPDiagnosticsStateManager } from "./LSPDiagnosticsStateManager.js";

// Types
export type {
  LSPLanguage,
  DiagnosticSeverity,
  Diagnostic,
  ServerStatus,
  LSPConfig,
  ILSPClient,
  ILSPInstaller,
  GetDiagnosticsInput,
  LSPStatusInput,
} from "./types.js";

export { getDefaultLSPConfig, severityFromNumber } from "./types.js";

// Utils
export { detectLanguage, isLSPSupported } from "./utils/language-detector.js";

// Clients (for extension)
export { BaseLSPClient } from "./BaseLSPClient.js";
export { TypeScriptClient } from "./clients/TypeScriptClient.js";
export { PyrightClient } from "./clients/PyrightClient.js";
export { JDTLSClient } from "./clients/JDTLSClient.js";

// Installers (for extension)
export { TypeScriptInstaller } from "./installers/TypeScriptInstaller.js";
export { PyrightInstaller } from "./installers/PyrightInstaller.js";
export { JDTLSInstaller } from "./installers/JDTLSInstaller.js";
