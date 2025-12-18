import { colors } from "./colors.js";

export interface DiffOptions {
  contextLines?: number;      // Default 3
  maxLines?: number;          // Truncate large diffs
  showLineNumbers?: boolean;  // Default true
  compactMode?: boolean;      // Hide unchanged sections
}

export interface DiffLine {
  lineNum: number;
  type: "added" | "removed" | "context" | "separator";
  content: string;
  oldLineNum?: number;
  newLineNum?: number;
}

export class DiffRenderer {
  /**
   * Renders a unified diff with context lines and color coding
   */
  static renderUnified(
    oldContent: string,
    newContent: string,
    options: DiffOptions = {}
  ): string {
    const {
      contextLines = 3,
      maxLines = 1000,
      showLineNumbers = true,
      compactMode = false
    } = options;

    const oldLines = oldContent.split("\n");
    const newLines = newContent.split("\n");

    const diffLines = this.computeDiff(oldLines, newLines, contextLines);

    if (compactMode) {
      return this.renderCompactDiff(diffLines, showLineNumbers, maxLines);
    }

    return this.renderFullDiff(diffLines, showLineNumbers, maxLines);
  }

  /**
   * Renders an inline diff showing changes within the same view
   */
  static renderInline(oldContent: string, newContent: string): string {
    const oldLines = oldContent.split("\n");
    const newLines = newContent.split("\n");

    let result = "";
    const maxLen = Math.max(oldLines.length, newLines.length);

    for (let i = 0; i < maxLen; i++) {
      const oldLine = oldLines[i] || "";
      const newLine = newLines[i] || "";
      const lineNum = String(i + 1).padStart(4);

      if (oldLine === newLine) {
        result += `${colors.gray}  ${lineNum} ${colors.reset}${oldLine}\n`;
      } else if (!oldLine) {
        result += `${colors.bgGreenDim}${colors.green}+ ${lineNum} ${newLine}${colors.reset}\n`;
      } else if (!newLine) {
        result += `${colors.bgRedDim}${colors.red}- ${lineNum} ${oldLine}${colors.reset}\n`;
      } else {
        result += `${colors.bgRedDim}${colors.red}- ${lineNum} ${oldLine}${colors.reset}\n`;
        result += `${colors.bgGreenDim}${colors.green}+ ${lineNum} ${newLine}${colors.reset}\n`;
      }
    }

    return result;
  }

  /**
   * Highlights diff output with color coding and backgrounds
   */
  static highlightChanges(diff: string): string {
    return diff.split("\n").map(line => {
      if (line.startsWith("+")) {
        return `${colors.bgGreenDim}${colors.green}${line}${colors.reset}`;
      } else if (line.startsWith("-")) {
        return `${colors.bgRedDim}${colors.red}${line}${colors.reset}`;
      } else if (line.startsWith("@@")) {
        return `${colors.cyan}${line}${colors.reset}`;
      } else {
        return line;
      }
    }).join("\n");
  }

  private static computeDiff(
    oldLines: string[],
    newLines: string[],
    contextLines: number
  ): DiffLine[] {
    const diffLines: DiffLine[] = [];
    let oldLineNum = 1;
    let newLineNum = 1;

    const maxLen = Math.max(oldLines.length, newLines.length);

    for (let i = 0; i < maxLen; i++) {
      const oldLine = oldLines[i];
      const newLine = newLines[i];

      if (oldLine === newLine) {
        diffLines.push({
          lineNum: i + 1,
          type: "context",
          content: oldLine || "",
          oldLineNum: oldLineNum++,
          newLineNum: newLineNum++
        });
      } else if (oldLine && !newLine) {
        diffLines.push({
          lineNum: i + 1,
          type: "removed",
          content: oldLine,
          oldLineNum: oldLineNum++
        });
      } else if (!oldLine && newLine) {
        diffLines.push({
          lineNum: i + 1,
          type: "added",
          content: newLine,
          newLineNum: newLineNum++
        });
      } else {
        // Both exist but are different
        diffLines.push({
          lineNum: i + 1,
          type: "removed",
          content: oldLine,
          oldLineNum: oldLineNum++
        });
        diffLines.push({
          lineNum: i + 1,
          type: "added",
          content: newLine,
          newLineNum: newLineNum++
        });
      }
    }

    return diffLines;
  }

  private static renderFullDiff(
    diffLines: DiffLine[],
    showLineNumbers: boolean,
    maxLines: number
  ): string {
    let result = "";
    let lineCount = 0;

    for (const line of diffLines) {
      if (lineCount >= maxLines) {
        result += `${colors.yellow}... (${diffLines.length - lineCount} more lines truncated)${colors.reset}\n`;
        break;
      }

      result += this.renderDiffLine(line, showLineNumbers);
      lineCount++;
    }

    return result;
  }

  private static renderDiffLine(line: DiffLine, showLineNumbers: boolean): string {
    const lineNum = line.newLineNum || line.oldLineNum || line.lineNum;
    const num = showLineNumbers ? String(lineNum).padStart(4) : "";

    if (line.type === "added") {
      return `${colors.bgGreenDim}${colors.green}${num} + ${line.content}${colors.reset}\n`;
    } else if (line.type === "removed") {
      return `${colors.bgRedDim}${colors.red}${num} - ${line.content}${colors.reset}\n`;
    } else {
      return `${colors.gray}${num}   ${colors.reset}${line.content}\n`;
    }
  }

  private static renderCompactDiff(
    diffLines: DiffLine[],
    showLineNumbers: boolean,
    maxLines: number
  ): string {
    let result = "";
    let lineCount = 0;
    let consecutiveContext = 0;
    const maxConsecutiveContext = 3;

    for (const line of diffLines) {
      if (lineCount >= maxLines) {
        result += `${colors.yellow}... (${diffLines.length - lineCount} more lines truncated)${colors.reset}\n`;
        break;
      }

      if (line.type === "context") {
        consecutiveContext++;
        if (consecutiveContext > maxConsecutiveContext) {
          if (consecutiveContext === maxConsecutiveContext + 1) {
            result += `${colors.gray}... (unchanged lines hidden)${colors.reset}\n`;
          }
          continue;
        }
      } else {
        consecutiveContext = 0;
      }

      result += this.renderDiffLine(line, showLineNumbers);
      lineCount++;
    }

    return result;
  }

  /**
   * Generates a summary of changes
   */
  static summarizeChanges(oldContent: string, newContent: string): string {
    const oldLines = oldContent.split("\n");
    const newLines = newContent.split("\n");

    let added = 0;
    let removed = 0;
    let modified = 0;

    const maxLen = Math.max(oldLines.length, newLines.length);

    for (let i = 0; i < maxLen; i++) {
      const oldLine = oldLines[i];
      const newLine = newLines[i];

      if (oldLine === newLine) {
        continue;
      } else if (!oldLine) {
        added++;
      } else if (!newLine) {
        removed++;
      } else {
        modified++;
      }
    }

    const parts = [];
    if (added > 0) parts.push(`${colors.green}+${added}${colors.reset}`);
    if (removed > 0) parts.push(`${colors.red}-${removed}${colors.reset}`);
    if (modified > 0) parts.push(`${colors.yellow}~${modified}${colors.reset}`);

    return parts.length > 0 ? parts.join(" ") : "No changes";
  }
}
