import { colors } from "../utils/colors.js";
export const SEVERITY_CONFIGS = {
    debug: { level: "debug", color: colors.gray, icon: "D", logLevel: 0 },
    info: { level: "info", color: colors.blue, icon: "i", logLevel: 1 },
    success: { level: "success", color: colors.green, icon: "✓", logLevel: 2 },
    warning: { level: "warning", color: colors.yellow, icon: "!", logLevel: 3 },
    error: { level: "error", color: colors.red, icon: "✗", logLevel: 4 },
    critical: { level: "critical", color: colors.red + colors.bold, icon: "!!", logLevel: 5 }
};
let minSeverityLevel = "info";
export function setMinSeverityLevel(level) {
    minSeverityLevel = level;
}
export function getMinSeverityLevel() {
    return minSeverityLevel;
}
export function shouldLog(severity) {
    const config = SEVERITY_CONFIGS[severity];
    const minConfig = SEVERITY_CONFIGS[minSeverityLevel];
    return config.logLevel >= minConfig.logLevel;
}
export function formatSeverity(severity) {
    const config = SEVERITY_CONFIGS[severity];
    return `${config.color}${config.icon}${colors.reset}`;
}
export function logWithSeverity(message, severity = "info") {
    if (!shouldLog(severity)) {
        return;
    }
    const config = SEVERITY_CONFIGS[severity];
    const icon = formatSeverity(severity);
    console.log(`${icon} ${config.color}${message}${colors.reset}`);
}
export function getSeverityConfig(severity) {
    return SEVERITY_CONFIGS[severity];
}
