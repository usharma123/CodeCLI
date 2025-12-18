import { colors } from "../utils/colors.js";

export interface DryRunConfig {
  enabled: boolean;
  showDiffs: boolean;
  verbose: boolean;
}

export interface DryRunResult {
  toolName: string;
  args: any;
  simulatedEffect: string;
  wouldSucceed: boolean;
  warnings: string[];
  timestamp: number;
}

export class DryRunManager {
  private config: DryRunConfig;
  private results: DryRunResult[] = [];

  constructor(config: Partial<DryRunConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? false,
      showDiffs: config.showDiffs ?? true,
      verbose: config.verbose ?? false
    };
  }

  /**
   * Check if dry-run mode is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Enable or disable dry-run mode
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    if (enabled) {
      console.log(`\n${colors.yellow}[DRY RUN MODE] No changes will be applied${colors.reset}\n`);
    }
  }

  /**
   * Simulate a tool execution
   */
  async simulateTool(toolName: string, args: any): Promise<DryRunResult> {
    const result: DryRunResult = {
      toolName,
      args,
      simulatedEffect: "",
      wouldSucceed: true,
      warnings: [],
      timestamp: Date.now()
    };

    // Simulate based on tool type
    switch (toolName) {
      case "write_file":
        result.simulatedEffect = this.simulateWriteFile(args);
        break;

      case "edit_file":
        result.simulatedEffect = this.simulateEditFile(args);
        break;

      case "patch_file":
        result.simulatedEffect = this.simulatePatchFile(args);
        break;

      case "run_command":
        result.simulatedEffect = this.simulateRunCommand(args);
        break;

      case "run_tests":
        result.simulatedEffect = this.simulateRunTests(args);
        break;

      case "scaffold_project":
        result.simulatedEffect = this.simulateScaffold(args);
        break;

      default:
        result.simulatedEffect = `Would execute: ${toolName}`;
        result.warnings.push("Simulation not implemented for this tool");
    }

    this.results.push(result);
    return result;
  }

  /**
   * Simulate write_file operation
   */
  private simulateWriteFile(args: any): string {
    const { path, content } = args;
    const lines = content?.split("\n").length || 0;

    return `Would write ${lines} lines to ${colors.bold}${path}${colors.reset}`;
  }

  /**
   * Simulate edit_file operation
   */
  private simulateEditFile(args: any): string {
    const { path, old_str, new_str } = args;
    const oldLines = old_str?.split("\n").length || 0;
    const newLines = new_str?.split("\n").length || 0;

    return `Would edit ${colors.bold}${path}${colors.reset}: replace ${oldLines} lines with ${newLines} lines`;
  }

  /**
   * Simulate patch_file operation
   */
  private simulatePatchFile(args: any): string {
    const { path, patch } = args;

    return `Would apply patch to ${colors.bold}${path}${colors.reset}`;
  }

  /**
   * Simulate run_command operation
   */
  private simulateRunCommand(args: any): string {
    const { command, cwd } = args;
    const workDir = cwd || process.cwd();

    return `Would run command in ${workDir}:\n  ${colors.cyan}${command}${colors.reset}`;
  }

  /**
   * Simulate run_tests operation
   */
  private simulateRunTests(args: any): string {
    const { language, mode } = args;

    return `Would run ${mode || "full"} tests for ${language || "unknown"} project`;
  }

  /**
   * Simulate scaffold_project operation
   */
  private simulateScaffold(args: any): string {
    const { project_type, name } = args;

    return `Would scaffold ${project_type} project: ${colors.bold}${name}${colors.reset}`;
  }

  /**
   * Display simulation result
   */
  displayResult(result: DryRunResult): void {
    console.log(`\n${colors.yellow}[DRY RUN]${colors.reset} ${result.simulatedEffect}`);

    if (this.config.verbose && Object.keys(result.args).length > 0) {
      console.log(`${colors.gray}Arguments:${colors.reset}`);
      console.log(`${colors.gray}${JSON.stringify(result.args, null, 2)}${colors.reset}`);
    }

    if (result.warnings.length > 0) {
      for (const warning of result.warnings) {
        console.log(`${colors.yellow}  Warning: ${warning}${colors.reset}`);
      }
    }

    console.log();
  }

  /**
   * Get all simulation results
   */
  getResults(): DryRunResult[] {
    return [...this.results];
  }

  /**
   * Export summary of all simulations
   */
  exportSummary(): string {
    if (this.results.length === 0) {
      return "No operations simulated";
    }

    let summary = `${colors.yellow}Dry Run Summary${colors.reset}\n`;
    summary += `${colors.yellow}${"=".repeat(40)}${colors.reset}\n\n`;

    // Count operations by type
    const counts: Record<string, number> = {};
    for (const result of this.results) {
      counts[result.toolName] = (counts[result.toolName] || 0) + 1;
    }

    summary += `${colors.bold}Operations that would be performed:${colors.reset}\n`;
    for (const [tool, count] of Object.entries(counts)) {
      summary += `  ${tool}: ${count}\n`;
    }

    summary += `\n${colors.bold}Total: ${this.results.length} operation(s)${colors.reset}\n`;

    // List warnings
    const allWarnings = this.results.flatMap(r => r.warnings);
    if (allWarnings.length > 0) {
      summary += `\n${colors.yellow}Warnings: ${allWarnings.length}${colors.reset}\n`;
      for (const warning of new Set(allWarnings)) {
        summary += `  - ${warning}\n`;
      }
    }

    summary += `\n${colors.green}No changes were actually made${colors.reset}\n`;

    return summary;
  }

  /**
   * Reset all results
   */
  reset(): void {
    this.results = [];
  }

  /**
   * Get configuration
   */
  getConfig(): DryRunConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<DryRunConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Global singleton
let dryRunManagerInstance: DryRunManager | null = null;

export function getDryRunManager(): DryRunManager {
  if (!dryRunManagerInstance) {
    dryRunManagerInstance = new DryRunManager();
  }
  return dryRunManagerInstance;
}

export function initializeDryRun(enabled: boolean): DryRunManager {
  dryRunManagerInstance = new DryRunManager({ enabled });
  return dryRunManagerInstance;
}
