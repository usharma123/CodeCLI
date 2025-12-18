import * as fs from "fs/promises";
import * as path from "path";

export interface IgnorePattern {
  pattern: string;
  negated: boolean; // ! prefix
  directory: boolean; // / suffix
  regex: RegExp;
}

export class ClIgnore {
  private patterns: IgnorePattern[] = [];
  private clignorePath: string = ".clignore";
  private projectRoot: string;
  private enabled: boolean = true;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.clignorePath = path.join(projectRoot, ".clignore");
  }

  /**
   * Load ignore patterns from .clignore file
   */
  async load(): Promise<void> {
    try {
      const content = await fs.readFile(this.clignorePath, "utf-8");
      this.parsePatterns(content);
    } catch (error: any) {
      if (error.code === "ENOENT") {
        // File doesn't exist, create default template
        await this.createDefaultTemplate();
        const content = await fs.readFile(this.clignorePath, "utf-8");
        this.parsePatterns(content);
      } else {
        throw error;
      }
    }
  }

  /**
   * Create default .clignore template
   */
  async createDefaultTemplate(): Promise<void> {
    const templatePath = path.join(__dirname, "../../.clignore.template");

    try {
      const templateContent = await fs.readFile(templatePath, "utf-8");
      await fs.writeFile(this.clignorePath, templateContent, "utf-8");
    } catch (error) {
      // If template doesn't exist, create basic default
      const defaultContent = `# CodeCLI Ignore Patterns
node_modules/
dist/
.git/
.env
*.log
*.tmp
`;
      await fs.writeFile(this.clignorePath, defaultContent, "utf-8");
    }
  }

  /**
   * Parse patterns from .clignore content
   */
  private parsePatterns(content: string): void {
    this.patterns = [];
    const lines = content.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const negated = trimmed.startsWith("!");
      const pattern = negated ? trimmed.substring(1) : trimmed;
      const directory = pattern.endsWith("/");
      const cleanPattern = directory ? pattern.slice(0, -1) : pattern;

      const regex = this.globToRegex(cleanPattern);

      this.patterns.push({
        pattern: cleanPattern,
        negated,
        directory,
        regex
      });
    }
  }

  /**
   * Convert glob pattern to RegExp
   */
  private globToRegex(pattern: string): RegExp {
    // Escape special regex characters except * and ?
    let regexStr = pattern
      .replace(/\\/g, "\\\\")
      .replace(/\./g, "\\.")
      .replace(/\+/g, "\\+")
      .replace(/\^/g, "\\^")
      .replace(/\$/g, "\\$")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)")
      .replace(/\[/g, "\\[")
      .replace(/\]/g, "\\]")
      .replace(/\{/g, "\\{")
      .replace(/\}/g, "\\}")
      .replace(/\|/g, "\\|");

    // Convert glob wildcards to regex
    regexStr = regexStr
      .replace(/\*\*/g, "DOUBLE_STAR")
      .replace(/\*/g, "[^/]*")
      .replace(/DOUBLE_STAR/g, ".*")
      .replace(/\?/g, "[^/]");

    // Anchor the pattern
    if (pattern.startsWith("/")) {
      regexStr = "^" + regexStr.substring(1);
    } else {
      regexStr = "(^|/)" + regexStr;
    }

    regexStr = regexStr + "(/|$)";

    return new RegExp(regexStr);
  }

  /**
   * Check if a file path should be ignored
   */
  isIgnored(filePath: string): boolean {
    if (!this.enabled) {
      return false;
    }

    // Normalize path to be relative to project root
    const relativePath = path.isAbsolute(filePath)
      ? path.relative(this.projectRoot, filePath)
      : filePath;

    // Replace backslashes with forward slashes for consistency
    const normalizedPath = relativePath.replace(/\\/g, "/");

    let ignored = false;

    for (const pattern of this.patterns) {
      const matches = pattern.regex.test(normalizedPath);

      if (matches) {
        if (pattern.negated) {
          // Negated pattern un-ignores the file
          ignored = false;
        } else {
          // Regular pattern ignores the file
          ignored = true;
        }
      }
    }

    return ignored;
  }

  /**
   * Filter an array of paths, removing ignored ones
   */
  filterPaths(paths: string[]): string[] {
    if (!this.enabled) {
      return paths;
    }

    return paths.filter(p => !this.isIgnored(p));
  }

  /**
   * Add a pattern at runtime
   */
  addPattern(pattern: string): void {
    const negated = pattern.startsWith("!");
    const cleanPattern = negated ? pattern.substring(1) : pattern;
    const directory = cleanPattern.endsWith("/");
    const finalPattern = directory ? cleanPattern.slice(0, -1) : cleanPattern;

    const regex = this.globToRegex(finalPattern);

    this.patterns.push({
      pattern: finalPattern,
      negated,
      directory,
      regex
    });
  }

  /**
   * Get all patterns
   */
  getPatterns(): IgnorePattern[] {
    return [...this.patterns];
  }

  /**
   * Enable or disable filtering
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if filtering is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

// Global singleton
let clignoreInstance: ClIgnore | null = null;

export function getClIgnore(): ClIgnore {
  if (!clignoreInstance) {
    clignoreInstance = new ClIgnore();
  }
  return clignoreInstance;
}

export async function initializeClIgnore(projectRoot?: string): Promise<ClIgnore> {
  clignoreInstance = new ClIgnore(projectRoot);
  await clignoreInstance.load();
  return clignoreInstance;
}
