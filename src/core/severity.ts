import { colors } from "../utils/colors.js";

export type SeverityLevel = "debug" | "info" | "success" | "warning" | "error" | "critical";

export interface SeverityConfig {
  level: SeverityLevel;
  color: string;
  icon: string;
  logLevel: number;
}

export const SEVERITY_CONFIGS: Record<SeverityLevel, SeverityConfig> = {
  debug: { level: "debug", color: colors.gray, icon: "D", logLevel: 0 },
  info: { level: "info", color: colors.blue, icon: "i", logLevel: 1 },
  success: { level: "success", color: colors.green, icon: "✓", logLevel: 2 },
  warning: { level: "warning", color: colors.yellow, icon: "!", logLevel: 3 },
  error: { level: "error", color: colors.red, icon: "✗", logLevel: 4 },
  critical: { level: "critical", color: colors.red + colors.bold, icon: "!!", logLevel: 5 }
};

let minSeverityLevel: SeverityLevel = "info";

export function setMinSeverityLevel(level: SeverityLevel): void {
  minSeverityLevel = level;
}

export function getMinSeverityLevel(): SeverityLevel {
  return minSeverityLevel;
}

export function shouldLog(severity: SeverityLevel): boolean {
  const config = SEVERITY_CONFIGS[severity];
  const minConfig = SEVERITY_CONFIGS[minSeverityLevel];
  return config.logLevel >= minConfig.logLevel;
}

export function formatSeverity(severity: SeverityLevel): string {
  const config = SEVERITY_CONFIGS[severity];
  return `${config.color}${config.icon}${colors.reset}`;
}

export function logWithSeverity(message: string, severity: SeverityLevel = "info"): void {
  if (!shouldLog(severity)) {
    return;
  }

  const config = SEVERITY_CONFIGS[severity];
  const icon = formatSeverity(severity);
  console.log(`${icon} ${config.color}${message}${colors.reset}`);
}

export function getSeverityConfig(severity: SeverityLevel): SeverityConfig {
  return SEVERITY_CONFIGS[severity];
}
