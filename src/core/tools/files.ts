import * as fs from "fs/promises";
import * as path from "path";
import {
  ToolDefinition,
  ReadFileInput,
  ListFilesInput,
  WriteFileInput,
  EditFileInput,
  PatchFileInput,
} from "../types.js";
import { confirmAction } from "../confirm.js";
import { colors } from "../../utils/colors.js";
import { getAgentInstance } from "./shared.js";
import { DiffRenderer } from "../../utils/diff-renderer.js";

/**
 * Validates that a file path doesn't attempt path traversal attacks
 * and resolves to a safe location within or relative to the working directory
 */
function validatePath(filePath: string): string {
  const resolved = path.resolve(process.cwd(), filePath);
  const cwd = path.resolve(process.cwd());

  // Allow paths within CWD or absolute paths (for flexibility)
  // This prevents "../../../etc/passwd" style attacks when relative
  if (!resolved.startsWith(cwd) && !path.isAbsolute(filePath)) {
    throw new Error(`Path traversal detected: ${filePath} resolves outside working directory`);
  }

  return resolved;
}

const readFileDefinition: ToolDefinition = {
  name: "read_file",
  description: "Read the contents of a given relative file path.",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "The relative path of a file in the working directory",
      },
    },
    required: ["path"],
    additionalProperties: false,
  },
  function: async (input: ReadFileInput) => {
    try {
      const validPath = validatePath(input.path);
      const content = await fs.readFile(validPath, "utf-8");
      if (content.length > 10000) {
        return content.substring(0, 10000) + "\n... (truncated, file too large)";
      }
      return content;
    } catch (error) {
      throw new Error(`Failed to read file: ${error}`);
    }
  },
};

const listFilesDefinition: ToolDefinition = {
  name: "list_files",
  description: "List files and directories at a given path.",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Optional relative path to list files from.",
      },
    },
    additionalProperties: false,
  },
  function: async (input: ListFilesInput) => {
    const dir = input.path || ".";
    try {
      const validDir = validatePath(dir);
      const files: string[] = [];
      async function walk(currentPath: string, basePath: string, depth: number = 0) {
        if (depth > 3) return;
        const entries = await fs.readdir(currentPath, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.name === "node_modules" || entry.name === ".git" || entry.name.startsWith(".")) {
            continue;
          }
          const fullPath = path.join(currentPath, entry.name);
          const relativePath = path.relative(basePath, fullPath);
          if (entry.isDirectory()) {
            files.push(relativePath + "/");
            if (depth < 3) await walk(fullPath, basePath, depth + 1);
          } else {
            files.push(relativePath);
          }
        }
      }
      await walk(validDir, validDir);
      return JSON.stringify(files);
    } catch (error) {
      throw new Error(`Failed to list files: ${error}`);
    }
  },
};

const writeFileDefinition: ToolDefinition = {
  name: "write_file",
  description: "Create a new file or completely overwrite an existing file with the provided content.",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "The path where the file should be created",
      },
      content: {
        type: "string",
        description: "The complete content to write to the file",
      },
    },
    required: ["path", "content"],
    additionalProperties: false,
  },
  function: async (input: WriteFileInput) => {
    getAgentInstance();
    try {
      if (!input.path || typeof input.path !== "string") {
        throw new Error("write_file requires a string 'path' (relative or absolute).");
      }
      const validPath = validatePath(input.path);
      const hasContentProp = input && Object.prototype.hasOwnProperty.call(input, "content");
      if (!hasContentProp) {
        throw new Error(
          "write_file is missing the required 'content' string. Please call with both 'path' and the full file contents, e.g. {\"path\":\"tests/python/test_agent.py\",\"content\":\"...\"}."
        );
      }
      if (typeof input.content !== "string") {
        throw new Error("write_file 'content' must be a string (can be empty).");
      }

      let fileExists = true;
      let currentContent = "";
      try {
        currentContent = await fs.readFile(validPath, "utf-8");
      } catch (error: any) {
        if (error.code === "ENOENT") {
          fileExists = false;
        } else {
          throw error;
        }
      }

      const lines = input.content.split("\n");
      const totalLines = lines.length;

      if (fileExists && currentContent) {
        // Show diff for existing file
        console.log(
          `  ${colors.gray}└ Overwrite ${colors.bold}${input.path}${colors.reset}${colors.gray} (${totalLines} lines)${colors.reset}`
        );
        console.log();
        const summary = DiffRenderer.summarizeChanges(currentContent, input.content);
        console.log(`    ${colors.gray}Changes: ${summary}${colors.reset}`);
        console.log();
        const diff = DiffRenderer.renderUnified(currentContent, input.content, {
          contextLines: 3,
          maxLines: 50,
          compactMode: true
        });
        console.log(diff);
      } else {
        // Show preview for new file
        const previewCount = Math.min(15, totalLines);
        console.log(
          `  ${colors.gray}└ Create ${colors.bold}${input.path}${colors.reset}${colors.gray} (${totalLines} lines)${colors.reset}`
        );
        for (let i = 0; i < previewCount; i++) {
          const lineNum = String(i + 1).padStart(4, " ");
          console.log(`    ${colors.gray}${lineNum}${colors.reset} ${colors.green}+${colors.reset} ${lines[i]}`);
        }
        if (totalLines > previewCount) {
          console.log(`    ${colors.gray}     ... (${totalLines - previewCount} more lines)${colors.reset}`);
        }
      }

      const confirmed = await confirmAction("Apply changes?");
      if (confirmed) {
        const dir = path.dirname(validPath);
        if (dir !== ".") {
          await fs.mkdir(dir, { recursive: true });
        }
        await fs.writeFile(validPath, input.content, "utf-8");
        return `File ${input.path} ${fileExists ? "overwritten" : "created"} successfully`;
      }
      return "Operation cancelled by user";
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to write file: ${error}`);
    }
  },
};

const editFileDefinition: ToolDefinition = {
  name: "edit_file",
  description: "Edit a file by replacing specific text. Use this for partial file modifications.",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "The path to the file",
      },
      old_str: {
        type: "string",
        description: "Text to search for and replace. Use empty string to append to file.",
      },
      new_str: {
        type: "string",
        description: "Text to replace old_str with",
      },
    },
    required: ["path", "old_str", "new_str"],
    additionalProperties: false,
  },
  function: async (input: EditFileInput) => {
    if (!input.path || input.old_str === input.new_str) {
      throw new Error("Invalid input parameters");
    }

    getAgentInstance();
    try {
      const validPath = validatePath(input.path);
      let currentContent: string = "";
      let fileExists = true;

      try {
        currentContent = await fs.readFile(validPath, "utf-8");
      } catch (error: any) {
        if (error.code === "ENOENT") {
          fileExists = false;
          if (input.old_str !== "") {
            throw new Error(`File ${input.path} does not exist. Use write_file to create new files.`);
          }
        } else {
          throw error;
        }
      }

      let newContent: string;
      if (!fileExists) {
        newContent = input.new_str;
      } else {
        if (!currentContent.includes(input.old_str) && input.old_str !== "") {
          throw new Error(
            `Text not found in file: "${input.old_str.substring(0, 50)}${input.old_str.length > 50 ? "..." : ""}"`
          );
        }
        newContent = currentContent.replaceAll(input.old_str, input.new_str);
      }

      const summary = DiffRenderer.summarizeChanges(currentContent, newContent);
      console.log(
        `  ${colors.gray}└ Updated ${colors.bold}${input.path}${colors.reset}${colors.gray} - Changes: ${summary}${colors.reset}`
      );
      console.log();

      const diff = DiffRenderer.renderUnified(currentContent, newContent, {
        contextLines: 3,
        maxLines: 30,
        compactMode: false
      });
      console.log(diff);

      const confirmed = await confirmAction("Apply changes?");
      if (confirmed) {
        if (!fileExists) {
          const dir = path.dirname(validPath);
          if (dir !== ".") {
            await fs.mkdir(dir, { recursive: true });
          }
        }
        await fs.writeFile(validPath, newContent, "utf-8");
        return "File successfully updated";
      }
      return "Changes cancelled by user";
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to edit file: ${error}`);
    }
  },
};

const patchFileDefinition: ToolDefinition = {
  name: "patch_file",
  description:
    "Apply a unified diff patch to a file. Use this to make complex multi-line changes. The patch should be in unified diff format.",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "The path to the file to patch",
      },
      patch: {
        type: "string",
        description:
          "The unified diff patch to apply. Should start with @@ line numbers and contain - lines (remove) and + lines (add).",
      },
    },
    required: ["path", "patch"],
    additionalProperties: false,
  },
  function: async (input: PatchFileInput) => {
    if (!input.path || !input.patch) {
      throw new Error("Invalid input parameters");
    }

    getAgentInstance();
    try {
      const validPath = validatePath(input.path);
      // Read current file content
      let currentContent: string;
      try {
        currentContent = await fs.readFile(validPath, "utf-8");
      } catch (error: any) {
        if (error.code === "ENOENT") {
          throw new Error(
            `File ${input.path} does not exist. Use write_file to create new files.`
          );
        }
        throw error;
      }

      // Parse and apply the patch
      const lines = currentContent.split("\n");
      const patchLines = input.patch.split("\n");

      // Find the @@ hunk header
      let hunkHeader = patchLines.find((line) => line.startsWith("@@"));
      if (!hunkHeader) {
        throw new Error(
          "Invalid patch format: no @@ hunk header found. Patch should be in unified diff format.\n\n" +
          "Example format:\n" +
          "@@ -10,3 +10,4 @@\n" +
          " unchanged line\n" +
          "-removed line\n" +
          "+added line\n\n" +
          "Suggestion: For simple changes, use edit_file instead."
        );
      }

      // Extract line numbers from @@ -start,count +start,count @@
      // More flexible regex to handle various formats
      const match = hunkHeader.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (!match) {
        console.log(`${colors.red}Failed to parse hunk header: "${hunkHeader}"${colors.reset}`);
        console.log(`${colors.yellow}This usually means the patch format is incomplete or incorrect.${colors.reset}`);
        console.log(`${colors.cyan}Suggestion: Use edit_file for simple string replacements instead.${colors.reset}\n`);

        throw new Error(
          `Invalid hunk header format.\n\n` +
          `Expected format: "@@ -startLine,count +startLine,count @@"\n` +
          `Got: "${hunkHeader}"\n\n` +
          `Example of valid patch:\n` +
          `@@ -5,3 +5,3 @@\n` +
          ` function test() {\n` +
          `-  console.log("old");\n` +
          `+  console.log("new");\n` +
          ` }\n\n` +
          `Tip: For simple changes, use edit_file instead of patch_file.`
        );
      }

      const startLine = parseInt(match[1]) - 1; // Convert to 0-based index

      // Apply the patch
      const newLines = [...lines];
      let currentLine = startLine;
      let patchIndex = patchLines.findIndex((line) => line.startsWith("@@")) + 1;

      const removedLines: string[] = [];
      const addedLines: string[] = [];

      while (patchIndex < patchLines.length) {
        const patchLine = patchLines[patchIndex];

        if (patchLine.startsWith("-")) {
          // Remove line
          const lineContent = patchLine.substring(1);
          removedLines.push(lineContent);
          if (newLines[currentLine] === lineContent) {
            newLines.splice(currentLine, 1);
          } else {
            console.log(
              `${colors.yellow}⚠️  Warning: Line mismatch at ${currentLine + 1}${
                colors.reset
              }`
            );
            console.log(
              `${colors.gray}Expected: "${lineContent}"${colors.reset}`
            );
            console.log(
              `${colors.gray}Found: "${newLines[currentLine]}"${colors.reset}`
            );
          }
        } else if (patchLine.startsWith("+")) {
          // Add line
          const lineContent = patchLine.substring(1);
          addedLines.push(lineContent);
          newLines.splice(currentLine, 0, lineContent);
          currentLine++;
        } else if (patchLine.startsWith(" ")) {
          // Context line (unchanged)
          currentLine++;
        } else if (patchLine.startsWith("@@")) {
          // New hunk
          break;
        }

        patchIndex++;
      }

      const newContent = newLines.join("\n");

      // Show preview (Cursor-style)
      console.log(`  ${colors.gray}└ Patch ${colors.bold}${input.path}${colors.reset}${colors.gray} with ${colors.green}${addedLines.length} addition${addedLines.length !== 1 ? "s" : ""}${colors.gray} and ${colors.red}${removedLines.length} removal${removedLines.length !== 1 ? "s" : ""}${colors.reset}`);
      
      // Show removals with line numbers
      const maxPreview = 8;
      let lineNum = startLine + 1;
      removedLines.slice(0, maxPreview).forEach((line) => {
        const ln = String(lineNum).padStart(4, " ");
        console.log(`    ${colors.gray}${ln}${colors.reset} ${colors.red}-${colors.reset} ${colors.red}${line}${colors.reset}`);
      });
      if (removedLines.length > maxPreview) {
        console.log(`    ${colors.gray}     ... (${removedLines.length - maxPreview} more removals)${colors.reset}`);
      }
      
      // Show additions with line numbers
      lineNum = startLine + 1;
      addedLines.slice(0, maxPreview).forEach((line) => {
        const ln = String(lineNum).padStart(4, " ");
        console.log(`    ${colors.gray}${ln}${colors.reset} ${colors.green}+${colors.reset} ${colors.green}${line}${colors.reset}`);
        lineNum++;
      });
      if (addedLines.length > maxPreview) {
        console.log(`    ${colors.gray}     ... (${addedLines.length - maxPreview} more additions)${colors.reset}`);
      }

      // Ask for confirmation using Ink
      const confirmed = await confirmAction("Apply patch?");

      if (confirmed) {
        await fs.writeFile(validPath, newContent, "utf-8");
        return "Patch applied successfully";
      } else {
        return "Patch cancelled by user";
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to apply patch: ${error}`);
    }
  },
};

export const fileTools = [
  readFileDefinition,
  listFilesDefinition,
  writeFileDefinition,
  editFileDefinition,
  patchFileDefinition,
];
