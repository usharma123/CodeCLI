import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

export interface SlashCommand {
  name: string;
  aliases: string[];
  template: string;
  description: string;
  category: "testing" | "analysis" | "files" | "session" | "custom";
  parameterized: boolean;
}

export const BUILT_IN_COMMANDS: SlashCommand[] = [
  {
    name: "test",
    aliases: ["t"],
    template: "Run all tests and show me the results. If any fail, analyze and fix them.",
    description: "Run tests and fix failures",
    category: "testing",
    parameterized: false
  },
  {
    name: "fix",
    aliases: ["f"],
    template: "Analyze {0} for bugs and fix any issues you find.",
    description: "Fix bugs in a file",
    category: "analysis",
    parameterized: true
  },
  {
    name: "explain",
    aliases: ["e"],
    template: "Explain how {0} works in detail.",
    description: "Explain code functionality",
    category: "analysis",
    parameterized: true
  },
  {
    name: "refactor",
    aliases: ["r"],
    template: "Refactor {0} to improve code quality, readability, and maintainability.",
    description: "Refactor code",
    category: "files",
    parameterized: true
  },
  {
    name: "search",
    aliases: ["s"],
    template: "Search the codebase for {0} and show me where it's used.",
    description: "Search codebase",
    category: "analysis",
    parameterized: true
  },
  {
    name: "review",
    aliases: [],
    template: "Review {0} and provide feedback on code quality, potential bugs, and improvements.",
    description: "Code review",
    category: "analysis",
    parameterized: true
  },
  {
    name: "document",
    aliases: ["doc"],
    template: "Add comprehensive documentation and comments to {0}.",
    description: "Add documentation",
    category: "files",
    parameterized: true
  },
  {
    name: "optimize",
    aliases: ["o"],
    template: "Analyze and optimize the performance of {0}.",
    description: "Optimize code",
    category: "analysis",
    parameterized: true
  },
  {
    name: "help",
    aliases: ["h", "?"],
    template: "",  // Special handling
    description: "List all available slash commands",
    category: "custom",
    parameterized: false
  }
];

export class SlashCommandRegistry {
  private commands: Map<string, SlashCommand> = new Map();
  private customCommandsPath: string;

  constructor(customCommandsPath?: string) {
    this.customCommandsPath = customCommandsPath || path.join(os.homedir(), ".codecli", "commands.json");
    this.registerBuiltInCommands();
  }

  /**
   * Register built-in commands
   */
  private registerBuiltInCommands(): void {
    for (const cmd of BUILT_IN_COMMANDS) {
      this.commands.set(cmd.name, cmd);

      // Register aliases
      for (const alias of cmd.aliases) {
        this.commands.set(alias, cmd);
      }
    }
  }

  /**
   * Load custom commands from user config
   */
  async loadCustomCommands(): Promise<void> {
    try {
      const content = await fs.readFile(this.customCommandsPath, "utf-8");
      const customCommands = JSON.parse(content) as SlashCommand[];

      for (const cmd of customCommands) {
        this.commands.set(cmd.name, cmd);

        // Register aliases
        for (const alias of cmd.aliases) {
          this.commands.set(alias, cmd);
        }
      }
    } catch (error: any) {
      // File doesn't exist or is invalid, ignore
      if (error.code !== "ENOENT") {
        console.warn("Warning: Could not load custom commands:", error.message);
      }
    }
  }

  /**
   * Parse a slash command from user input
   */
  parseCommand(input: string): { command: SlashCommand; args: string[] } | null {
    const trimmed = input.trim();

    // Check if it starts with /
    if (!trimmed.startsWith("/")) {
      return null;
    }

    // Extract command name and arguments
    const parts = trimmed.substring(1).split(/\s+/);
    const commandName = parts[0].toLowerCase();
    const args = parts.slice(1);

    const command = this.commands.get(commandName);

    if (!command) {
      return null;
    }

    return { command, args };
  }

  /**
   * Expand a command template with arguments
   */
  expandCommand(command: SlashCommand, args: string[]): string {
    if (command.name === "help") {
      return this.generateHelpText();
    }

    let expanded = command.template;

    // Replace placeholders with arguments
    for (let i = 0; i < args.length; i++) {
      expanded = expanded.replace(`{${i}}`, args[i]);
    }

    // Check if all placeholders were filled
    if (expanded.includes("{") && expanded.includes("}")) {
      // Still has unfilled placeholders, return error
      throw new Error(`Command '/${command.name}' requires more arguments`);
    }

    return expanded;
  }

  /**
   * Generate help text listing all commands
   */
  private generateHelpText(): string {
    let help = "Available Slash Commands:\n\n";

    const categories: Record<string, SlashCommand[]> = {
      testing: [],
      analysis: [],
      files: [],
      session: [],
      custom: []
    };

    // Group commands by category
    const seen = new Set<string>();
    for (const [name, cmd] of this.commands) {
      if (seen.has(cmd.name)) continue;
      seen.add(cmd.name);

      categories[cmd.category].push(cmd);
    }

    // Display by category
    for (const [category, commands] of Object.entries(categories)) {
      if (commands.length === 0) continue;

      help += `${category.toUpperCase()}:\n`;

      for (const cmd of commands) {
        const aliases = cmd.aliases.length > 0 ? ` (${cmd.aliases.map(a => "/" + a).join(", ")})` : "";
        const params = cmd.parameterized ? " <arg>" : "";
        help += `  /${cmd.name}${params}${aliases} - ${cmd.description}\n`;
      }

      help += "\n";
    }

    help += "Usage:\n";
    help += "  /test - Run all tests\n";
    help += "  /fix src/index.ts - Fix bugs in a specific file\n";
    help += "  /explain MyClass - Explain how a class works\n";

    return help;
  }

  /**
   * Add a custom command
   */
  async addCustomCommand(command: SlashCommand): Promise<void> {
    this.commands.set(command.name, command);

    // Register aliases
    for (const alias of command.aliases) {
      this.commands.set(alias, command);
    }

    // Save to disk
    await this.saveCustomCommands();
  }

  /**
   * Save custom commands to disk
   */
  private async saveCustomCommands(): Promise<void> {
    try {
      const customCommands: SlashCommand[] = [];
      const seen = new Set<string>();

      for (const [name, cmd] of this.commands) {
        if (cmd.category === "custom" && !seen.has(cmd.name)) {
          seen.add(cmd.name);
          customCommands.push(cmd);
        }
      }

      const dir = path.dirname(this.customCommandsPath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(this.customCommandsPath, JSON.stringify(customCommands, null, 2), "utf-8");
    } catch (error) {
      console.warn("Warning: Could not save custom commands:", error);
    }
  }

  /**
   * Get all commands
   */
  listCommands(): SlashCommand[] {
    const commands: SlashCommand[] = [];
    const seen = new Set<string>();

    for (const [name, cmd] of this.commands) {
      if (!seen.has(cmd.name)) {
        seen.add(cmd.name);
        commands.push(cmd);
      }
    }

    return commands.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Check if input is a slash command
   */
  isSlashCommand(input: string): boolean {
    return input.trim().startsWith("/");
  }
}

// Global singleton
let registryInstance: SlashCommandRegistry | null = null;

export function getSlashCommandRegistry(customCommandsPath?: string): SlashCommandRegistry {
  if (!registryInstance) {
    registryInstance = new SlashCommandRegistry(customCommandsPath);
  }
  return registryInstance;
}
