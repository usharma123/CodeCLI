/**
 * LSP Types and Interfaces
 *
 * Type definitions for Language Server Protocol integration
 */
// Default LSP configuration
export function getDefaultLSPConfig() {
    return {
        enabled: true,
        autoInstall: true,
        diagnosticsDebounceMs: 500,
        serverTimeoutMs: 30000,
        maxDiagnosticsPerFile: 100,
    };
}
// Severity conversion from LSP numbers
export function severityFromNumber(severity) {
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
