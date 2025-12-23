import { readdir, readFile, stat, writeFile, mkdir } from "fs/promises";
import path from "path";
import { spawn } from "child_process";
import { renderMermaidToAscii, } from "../../utils/diagram-renderer.js";
/**
 * Render Mermaid diagram to PNG/SVG using mmdc CLI
 */
async function renderMermaidToImage(mermaidCode, outputPath, options) {
    const { format, theme, backgroundColor = "transparent", width = 1920, height = 1080 } = options;
    // Extract the mermaid code from the markdown code block
    const codeMatch = mermaidCode.match(/```mermaid\n([\s\S]*?)\n```/);
    const pureCode = codeMatch ? codeMatch[1] : mermaidCode;
    // Create temp directory for input file
    const tempDir = path.join(process.cwd(), ".diagrams-temp");
    const tempInputPath = path.join(tempDir, `input-${Date.now()}.mmd`);
    try {
        // Ensure temp directory exists
        await mkdir(tempDir, { recursive: true });
        // Write mermaid code to temp file
        await writeFile(tempInputPath, pureCode, "utf8");
        // Ensure output directory exists
        const outputDir = path.dirname(outputPath);
        await mkdir(outputDir, { recursive: true });
        // Create config for mmdc
        const configPath = path.join(tempDir, `config-${Date.now()}.json`);
        const config = {
            theme,
            backgroundColor,
            width,
            height,
        };
        await writeFile(configPath, JSON.stringify(config), "utf8");
        // Run mmdc
        return new Promise((resolve) => {
            let resolved = false;
            const args = [
                "-i", tempInputPath,
                "-o", outputPath,
                "-t", theme,
                "-b", backgroundColor,
                "-w", String(width),
                "-H", String(height),
            ];
            const mmdc = spawn("npx", ["--yes", "mmdc", ...args], {
                cwd: process.cwd(),
                stdio: ["pipe", "pipe", "pipe"],
            });
            const MAX_BUFFER_SIZE = 1024 * 1024;
            let stderr = "";
            let stdout = "";
            mmdc.stdout?.on("data", (data) => {
                if (stdout.length < MAX_BUFFER_SIZE) {
                    stdout += data.toString();
                }
            });
            mmdc.stderr?.on("data", (data) => {
                if (stderr.length < MAX_BUFFER_SIZE) {
                    stderr += data.toString();
                }
            });
            const cleanup = async (result) => {
                if (!resolved) {
                    resolved = true;
                    clearTimeout(timeoutId);
                    try {
                        const { unlink } = await import("fs/promises");
                        await unlink(tempInputPath).catch(() => { });
                        await unlink(configPath).catch(() => { });
                    }
                    catch {
                        // Ignore cleanup errors
                    }
                    resolve(result);
                }
            };
            mmdc.on("error", (err) => {
                cleanup({
                    success: false,
                    error: `Failed to spawn mmdc: ${err.message}. Make sure @mermaid-js/mermaid-cli is installed.`,
                });
            });
            mmdc.on("close", async (code) => {
                if (code === 0) {
                    await cleanup({
                        success: true,
                        path: outputPath,
                    });
                }
                else {
                    await cleanup({
                        success: false,
                        error: stderr || stdout || `mmdc exited with code ${code}`,
                    });
                }
            });
            const timeoutId = setTimeout(() => {
                if (!resolved) {
                    mmdc.kill("SIGKILL");
                    cleanup({
                        success: false,
                        error: "Rendering timed out after 60 seconds",
                    });
                }
            }, 60000);
        });
    }
    catch (err) {
        return {
            success: false,
            error: `Failed to prepare rendering: ${err instanceof Error ? err.message : String(err)}`,
        };
    }
}
// Configuration
const defaultIgnoredDirs = new Set([
    ".git",
    "node_modules",
    "dist",
    "build",
    "out",
    "coverage",
    "venv",
    ".venv",
    ".next",
    ".turbo",
    ".bun",
    "target",
    ".diagrams-temp",
    "diagrams",
]);
const defaultIgnoredFiles = new Set([
    "bun.lock",
    "package-lock.json",
    "pnpm-lock.yaml",
    "yarn.lock",
]);
const defaultExtensions = new Set([
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".mjs",
    ".cjs",
    ".py",
    ".java",
]);
function safeRelPath(rootAbs, absPath) {
    const rel = path.relative(rootAbs, absPath);
    return rel.split(path.sep).join("/");
}
async function pathExists(filePath) {
    try {
        await stat(filePath);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Collect file paths only (no content reading) - much faster than before
 */
async function collectFilePaths(rootAbs, opts) {
    const results = [];
    let truncated = false;
    async function traverse(dir, depth) {
        if (depth > opts.maxDepth || results.length >= opts.maxFiles) {
            truncated = results.length >= opts.maxFiles;
            return;
        }
        let entries;
        try {
            entries = await readdir(dir, { withFileTypes: true });
        }
        catch {
            return;
        }
        for (const entry of entries) {
            if (results.length >= opts.maxFiles) {
                truncated = true;
                return;
            }
            const name = entry.name;
            if (name.startsWith(".") && name !== ".github")
                continue;
            const absPath = path.join(dir, name);
            const relPath = safeRelPath(rootAbs, absPath);
            if (entry.isDirectory()) {
                if (defaultIgnoredDirs.has(name))
                    continue;
                if (!opts.includeTests && (name === "tests" || name === "test" || name === "__tests__"))
                    continue;
                results.push({ relPath, absPath, isDir: true });
                await traverse(absPath, depth + 1);
            }
            else if (entry.isFile()) {
                if (defaultIgnoredFiles.has(name))
                    continue;
                const ext = path.extname(name).toLowerCase();
                if (!defaultExtensions.has(ext))
                    continue;
                results.push({ relPath, absPath, isDir: false });
            }
        }
    }
    await traverse(rootAbs, 0);
    return { files: results, truncated };
}
/**
 * Score files to find likely entrypoints
 */
function scoreEntrypoint(relPath) {
    const base = path.basename(relPath).toLowerCase();
    const dir = path.dirname(relPath);
    let points = 0;
    // Directory scoring
    if (dir === ".")
        points += 10;
    else if (dir === "src")
        points += 8;
    else if (dir.startsWith("src/"))
        points += 5;
    // Filename scoring
    if (base.startsWith("index."))
        points += 10;
    if (base.startsWith("main."))
        points += 9;
    if (base.startsWith("app."))
        points += 8;
    if (base.startsWith("server."))
        points += 7;
    if (base.startsWith("cli."))
        points += 7;
    if (base.startsWith("entry."))
        points += 6;
    return points;
}
/**
 * Format file list as a tree structure
 */
function formatAsTree(files) {
    // Group files by directory
    const tree = new Map();
    for (const file of files) {
        if (file.isDir)
            continue;
        const dir = path.dirname(file.relPath);
        if (!tree.has(dir))
            tree.set(dir, []);
        tree.get(dir).push(path.basename(file.relPath));
    }
    // Sort directories
    const sortedDirs = Array.from(tree.keys()).sort();
    const lines = [];
    for (const dir of sortedDirs) {
        lines.push(`📁 ${dir === "." ? "(root)" : dir}/`);
        const files = tree.get(dir).sort();
        for (const file of files.slice(0, 10)) { // Limit files per dir
            lines.push(`   📄 ${file}`);
        }
        if (files.length > 10) {
            lines.push(`   ... and ${files.length - 10} more files`);
        }
    }
    return lines.join("\n");
}
/**
 * Generate a simple Mermaid diagram from directory structure
 * This is a fallback - the LLM should generate a better one from the context
 */
function generateSimpleDiagram(files, direction = "LR") {
    // Group by top-level directories
    const groups = new Map();
    for (const file of files) {
        if (file.isDir)
            continue;
        const parts = file.relPath.split("/");
        const group = parts[0] === "src" && parts.length > 1
            ? `src/${parts[1]}`
            : parts[0];
        groups.set(group, (groups.get(group) || 0) + 1);
    }
    // Build diagram
    const lines = [];
    lines.push("```mermaid");
    lines.push(`flowchart ${direction}`);
    lines.push("  subgraph Codebase");
    let i = 0;
    const sortedGroups = Array.from(groups.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15); // Limit to top 15 groups
    for (const [group, count] of sortedGroups) {
        i++;
        const safeId = `M${i}`;
        const label = `${group} (${count} files)`;
        lines.push(`    ${safeId}["${label}"]`);
    }
    lines.push("  end");
    lines.push("```");
    return lines.join("\n");
}
export const diagramTools = [
    {
        name: "generate_mermaid_diagram",
        description: "Analyze a codebase structure and generate a Mermaid diagram. Returns the file structure and key entrypoint contents for generating an architecture diagram.",
        parameters: {
            type: "object",
            properties: {
                root_dir: {
                    type: "string",
                    description: "Root directory to scan (default: current working directory).",
                },
                direction: {
                    type: "string",
                    enum: ["TB", "TD", "LR", "RL"],
                    description: "Mermaid flowchart direction (default: LR).",
                },
                include_tests: {
                    type: "boolean",
                    description: "Whether to include test directories (default: false).",
                },
                max_files: {
                    type: "number",
                    description: "Maximum number of files to list (default: 100).",
                },
                max_entrypoints: {
                    type: "number",
                    description: "Maximum number of entrypoint files to read (default: 5).",
                },
                output_format: {
                    type: "string",
                    enum: ["ascii", "png", "svg"],
                    description: "Output format: 'ascii' for terminal, 'png' or 'svg' for image files. Default: 'png'.",
                },
                output_path: {
                    type: "string",
                    description: "Custom output path for PNG/SVG files. Default: ./diagrams/diagram-{timestamp}.{format}",
                },
                theme: {
                    type: "string",
                    enum: ["default", "dark", "forest", "neutral"],
                    description: "Mermaid theme for rendering. Default: 'default'.",
                },
                mermaid_code: {
                    type: "string",
                    description: "If provided, skip analysis and directly render this Mermaid code to an image.",
                },
            },
            required: [],
            additionalProperties: false,
        },
        function: async (input) => {
            const rootDir = (input.root_dir || process.cwd()).trim() || process.cwd();
            const rootAbs = path.resolve(rootDir);
            const direction = input.direction || "LR";
            const includeTests = Boolean(input.include_tests);
            const maxFiles = Math.min(Math.max(input.max_files ?? 100, 10), 500);
            const maxEntrypoints = Math.min(Math.max(input.max_entrypoints ?? 5, 1), 10);
            const outputFormat = input.output_format || "png";
            const theme = input.theme || "default";
            // If mermaid_code is provided, just render it directly
            if (input.mermaid_code) {
                const timestamp = Date.now();
                const defaultPath = path.join(process.cwd(), "diagrams", `diagram-${timestamp}.${outputFormat === "ascii" ? "png" : outputFormat}`);
                const outputPath = input.output_path || defaultPath;
                if (outputFormat === "ascii") {
                    const asciiResult = await renderMermaidToAscii(input.mermaid_code);
                    if (asciiResult.success && asciiResult.ascii) {
                        return `ASCII Diagram:\n\n${asciiResult.ascii}`;
                    }
                    return `Error rendering ASCII: ${asciiResult.error}\n\nRaw Mermaid code:\n${input.mermaid_code}`;
                }
                const imageResult = await renderMermaidToImage(input.mermaid_code, outputPath, {
                    format: outputFormat,
                    theme,
                    backgroundColor: theme === "dark" ? "#1e1e1e" : "white",
                });
                if (imageResult.success && imageResult.path) {
                    return `✓ Diagram rendered successfully!\n  Path: ${imageResult.path}\n  Format: ${outputFormat.toUpperCase()}\n  Theme: ${theme}`;
                }
                return `Error rendering diagram: ${imageResult.error}\n\nRaw Mermaid code:\n${input.mermaid_code}`;
            }
            // Validate root directory
            if (!(await pathExists(rootAbs))) {
                return `Error: root_dir does not exist: ${rootAbs}`;
            }
            // Step 1: Collect file paths (fast - no content reading)
            const { files, truncated } = await collectFilePaths(rootAbs, {
                maxFiles,
                maxDepth: 5,
                includeTests,
            });
            if (files.length === 0) {
                return `No source files found under ${rootAbs} (extensions: ${Array.from(defaultExtensions).join(", ")}).`;
            }
            // Step 2: Find and read entrypoints
            const sourceFiles = files.filter(f => !f.isDir);
            const scoredFiles = sourceFiles
                .map(f => ({ ...f, score: scoreEntrypoint(f.relPath) }))
                .sort((a, b) => b.score - a.score);
            const entrypoints = scoredFiles.slice(0, maxEntrypoints);
            const entrypointContents = [];
            for (const ep of entrypoints) {
                try {
                    const content = await readFile(ep.absPath, "utf8");
                    // Only include first 100 lines to keep it manageable
                    const truncatedContent = content.split("\n").slice(0, 100).join("\n");
                    entrypointContents.push({ path: ep.relPath, content: truncatedContent });
                }
                catch {
                    // Skip files that can't be read
                }
            }
            // Step 3: Format output for LLM consumption
            const fileTree = formatAsTree(files);
            const simpleDiagram = generateSimpleDiagram(files, direction);
            // Build the output
            const output = [];
            output.push("# Codebase Analysis for Diagram Generation\n");
            output.push(`Scanned: ${files.length} items under ${safeRelPath(process.cwd(), rootAbs) || rootAbs}`);
            if (truncated)
                output.push(`(truncated at ${maxFiles} files)`);
            output.push("");
            output.push("## File Structure\n");
            output.push(fileTree);
            output.push("");
            output.push("## Key Entrypoints\n");
            for (const ep of entrypointContents) {
                output.push(`### ${ep.path}\n`);
                output.push("```typescript");
                output.push(ep.content);
                output.push("```\n");
            }
            output.push("## Auto-Generated Simple Diagram\n");
            output.push(simpleDiagram);
            output.push("");
            output.push("---");
            output.push("**To generate a PNG diagram**, call this tool again with the `mermaid_code` parameter containing your Mermaid diagram code.");
            output.push(`Output will be saved to: ./diagrams/diagram-{timestamp}.${outputFormat}`);
            return output.join("\n");
        },
    },
];
