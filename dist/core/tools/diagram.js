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
            let resolved = false; // Track if promise already resolved to prevent double resolution
            const args = [
                "-i", tempInputPath,
                "-o", outputPath,
                "-t", theme,
                "-b", backgroundColor,
                "-w", String(width),
                "-H", String(height),
            ];
            // Try to find mmdc in node_modules/.bin first, then fall back to npx
            const mmdc = spawn("npx", ["--yes", "mmdc", ...args], {
                cwd: process.cwd(),
                stdio: ["pipe", "pipe", "pipe"],
            });
            const MAX_BUFFER_SIZE = 1024 * 1024; // 1MB limit to prevent unbounded memory growth
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
            // Cleanup function to prevent double resolution
            const cleanup = async (result) => {
                if (!resolved) {
                    resolved = true;
                    clearTimeout(timeoutId);
                    // Clean up temp files
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
            // Set a timeout with forced kill
            const timeoutId = setTimeout(() => {
                if (!resolved) {
                    mmdc.kill("SIGKILL"); // Force kill the process
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
function isProbablyBinaryFile(content) {
    return content.includes("\u0000");
}
function groupForPath(relPath, mode) {
    if (mode === "file")
        return relPath;
    const parts = relPath.split("/");
    if (parts.length === 0)
        return relPath;
    if (mode === "directory") {
        return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : parts[0];
    }
    // auto
    if (parts[0] === "src" && parts.length >= 2)
        return `src/${parts[1]}`;
    if (parts[0] === "tests" && parts.length >= 2)
        return `tests/${parts[1]}`;
    return parts[0];
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
function uniq(items) {
    return Array.from(new Set(items));
}
function parseImports(relPath, content) {
    const ext = path.extname(relPath).toLowerCase();
    const imports = [];
    if (ext === ".ts" || ext === ".tsx" || ext === ".js" || ext === ".jsx" || ext === ".mjs" || ext === ".cjs") {
        const fromImport = /\bimport\s+[\s\S]*?\s+from\s+["']([^"']+)["']/g;
        const sideEffectImport = /\bimport\s+["']([^"']+)["']/g;
        const requireImport = /\brequire\(\s*["']([^"']+)["']\s*\)/g;
        const dynamicImport = /\bimport\(\s*["']([^"']+)["']\s*\)/g;
        // Use matchAll() to avoid infinite loop with regex.exec() and global flag
        for (const regex of [fromImport, sideEffectImport, requireImport, dynamicImport]) {
            const matches = content.matchAll(regex);
            for (const match of matches) {
                imports.push(match[1]);
            }
        }
        return uniq(imports);
    }
    if (ext === ".py") {
        const fromImport = /^\s*from\s+([.\w]+)\s+import\s+/gm;
        const directImport = /^\s*import\s+([.\w]+)(?:\s+as\s+\w+)?/gm;
        // Use matchAll() to avoid infinite loop with regex.exec() and global flag
        for (const match of content.matchAll(fromImport)) {
            imports.push(match[1]);
        }
        for (const match of content.matchAll(directImport)) {
            imports.push(match[1]);
        }
        return uniq(imports);
    }
    if (ext === ".java") {
        const javaImport = /^\s*import\s+([\w.]+)\s*;/gm;
        // Use matchAll() to avoid infinite loop with regex.exec() and global flag
        for (const match of content.matchAll(javaImport)) {
            imports.push(match[1]);
        }
        return uniq(imports);
    }
    return [];
}
function resolveJsTsImportCandidates(importPath) {
    const ext = path.extname(importPath);
    const withoutExt = ext ? importPath.slice(0, -ext.length) : importPath;
    return { raw: importPath, withoutExt, ext };
}
function jsTsExtensionsToTry(importExt) {
    const normalized = importExt.toLowerCase();
    if (normalized === ".js")
        return [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
    if (normalized === ".jsx")
        return [".tsx", ".jsx", ".ts", ".js"];
    if (normalized === ".mjs")
        return [".mts", ".mjs", ".ts", ".js"];
    if (normalized === ".cjs")
        return [".cts", ".cjs", ".ts", ".js"];
    if (normalized === ".ts")
        return [".ts", ".tsx"];
    if (normalized === ".tsx")
        return [".tsx"];
    return [normalized];
}
async function resolveLocalImport(rootAbs, fromAbs, fromRel, spec) {
    const fromExt = path.extname(fromRel).toLowerCase();
    if (fromExt === ".py") {
        if (!spec.startsWith("."))
            return null;
        const dots = spec.match(/^\.+/)?.[0].length ?? 0;
        const remainder = spec.slice(dots).replace(/\./g, "/");
        const fromDirRel = path.posix.dirname(fromRel);
        const upSegments = Math.max(dots - 1, 0);
        const baseDirRel = upSegments > 0
            ? fromDirRel.split("/").slice(0, Math.max(0, fromDirRel.split("/").length - upSegments)).join("/")
            : fromDirRel;
        const candidateRel = path.posix.join(baseDirRel || ".", remainder);
        const candidates = [
            path.join(rootAbs, candidateRel + ".py"),
            path.join(rootAbs, candidateRel, "__init__.py"),
        ];
        // Check all candidates in parallel and return first match
        const results = await Promise.all(candidates.map(async (abs) => {
            const exists = await pathExists(abs);
            return exists ? path.resolve(abs) : null;
        }));
        return results.find(r => r !== null) || null;
    }
    // JS/TS resolution (handles ".js" imports in TS source)
    if (!spec.startsWith("."))
        return null;
    const fromDir = path.dirname(fromAbs);
    const rawCandidate = path.resolve(fromDir, spec);
    const { withoutExt, ext } = resolveJsTsImportCandidates(rawCandidate);
    const extensions = ext ? jsTsExtensionsToTry(ext) : Array.from(defaultExtensions);
    const fileCandidates = [];
    if (ext) {
        fileCandidates.push(rawCandidate);
    }
    for (const tryExt of extensions) {
        fileCandidates.push(withoutExt + tryExt);
        fileCandidates.push(path.join(withoutExt, "index" + tryExt));
    }
    // Check all file candidates in parallel and return first match
    const uniqueCandidates = uniq(fileCandidates);
    const results = await Promise.all(uniqueCandidates.map(async (abs) => {
        const exists = await pathExists(abs);
        return exists ? path.resolve(abs) : null;
    }));
    return results.find(r => r !== null) || null;
}
function pickEntrypoints(files, maxEntrypoints) {
    const score = (relPath) => {
        const base = path.posix.basename(relPath).toLowerCase();
        const dir = path.posix.dirname(relPath);
        let points = 0;
        if (dir === ".")
            points += 8;
        if (dir === "src")
            points += 6;
        if (dir.startsWith("src/"))
            points += 3;
        if (base.startsWith("index."))
            points += 8;
        if (base.startsWith("main."))
            points += 7;
        if (base.startsWith("app."))
            points += 6;
        if (base.startsWith("server."))
            points += 6;
        if (base.startsWith("cli."))
            points += 6;
        return points;
    };
    return files
        .slice()
        .sort((a, b) => score(b.relPath) - score(a.relPath))
        .slice(0, Math.max(1, maxEntrypoints));
}
function mermaidIdFactory(prefix) {
    let i = 0;
    const map = new Map();
    return (label) => {
        const existing = map.get(label);
        if (existing)
            return existing;
        i += 1;
        const id = `${prefix}${i}`;
        map.set(label, id);
        return id;
    };
}
function formatMermaidFlowchart(params) {
    const entryId = mermaidIdFactory("E");
    const groupId = mermaidIdFactory("M");
    const lines = [];
    lines.push("```mermaid");
    lines.push(`flowchart ${params.direction}`);
    lines.push("  %% Entrypoints");
    lines.push("  subgraph Entrypoints");
    for (const ep of params.entrypoints) {
        lines.push(`    ${entryId(ep)}["${ep}"]`);
    }
    lines.push("  end");
    lines.push("  %% Modules");
    lines.push("  subgraph Modules");
    for (const g of params.groups) {
        lines.push(`    ${groupId(g)}["${g}"]`);
    }
    lines.push("  end");
    lines.push("  %% Entry → Modules");
    for (const edge of params.entryEdges) {
        lines.push(`  ${entryId(edge.from)} --> ${groupId(edge.to)}`);
    }
    lines.push("  %% Module dependencies");
    for (const edge of params.groupEdges) {
        const label = params.showCounts ? `|${edge.weight}|` : "";
        lines.push(`  ${groupId(edge.from)} -->${label} ${groupId(edge.to)}`);
    }
    lines.push("```");
    return lines.join("\n");
}
async function collectFiles(rootAbs, opts) {
    const stack = [rootAbs];
    const records = [];
    let truncated = false;
    while (stack.length > 0) {
        const current = stack.pop();
        let entries;
        try {
            entries = await readdir(current, { withFileTypes: true });
        }
        catch {
            continue;
        }
        for (const entry of entries) {
            if (records.length >= opts.maxFiles) {
                truncated = true;
                break;
            }
            const name = entry.name;
            if (name.startsWith(".")) {
                if (name !== ".github")
                    continue;
            }
            const absPath = path.join(current, name);
            if (entry.isDirectory()) {
                if (defaultIgnoredDirs.has(name))
                    continue;
                if (!opts.includeTests && (name === "tests" || name === "test" || name === "__tests__"))
                    continue;
                stack.push(absPath);
                continue;
            }
            if (!entry.isFile())
                continue;
            if (defaultIgnoredFiles.has(name))
                continue;
            const ext = path.extname(name).toLowerCase();
            if (!defaultExtensions.has(ext))
                continue;
            let size = 0;
            try {
                size = (await stat(absPath)).size;
            }
            catch {
                continue;
            }
            if (size > opts.maxFileBytes)
                continue;
            const relPath = safeRelPath(rootAbs, absPath);
            records.push({
                absPath: path.resolve(absPath),
                relPath,
                group: groupForPath(relPath, "auto"),
                ext,
            });
        }
        if (records.length >= opts.maxFiles)
            break;
    }
    return { files: records, truncated };
}
export const diagramTools = [
    {
        name: "generate_mermaid_diagram",
        description: "Scan a local codebase and generate a Mermaid flowchart describing high-level module flow (entrypoints and directory-level dependencies).",
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
                grouping: {
                    type: "string",
                    enum: ["auto", "directory", "file"],
                    description: "How to group nodes: auto (recommended), directory (2-level), or file (per-file, can be noisy).",
                },
                include_tests: {
                    type: "boolean",
                    description: "Whether to include test directories (default: false).",
                },
                max_files: {
                    type: "number",
                    description: "Maximum number of source files to scan (default: 400).",
                },
                max_edges: {
                    type: "number",
                    description: "Maximum number of dependency edges to include (default: 60).",
                },
                max_entrypoints: {
                    type: "number",
                    description: "Maximum number of detected entrypoints to include (default: 3).",
                },
                show_edge_counts: {
                    type: "boolean",
                    description: "Whether to label edges with import counts (default: false).",
                },
                render_ascii: {
                    type: "boolean",
                    description: "Render diagram as ASCII art in terminal (requires mermaid-ascii to be installed). Default: true. Ignored if output_format is set.",
                },
                output_format: {
                    type: "string",
                    enum: ["ascii", "png", "svg"],
                    description: "Output format: 'ascii' for terminal rendering, 'png' or 'svg' for image files. Default: 'ascii'.",
                },
                output_path: {
                    type: "string",
                    description: "Custom output path for PNG/SVG files. Default: ./diagrams/diagram-{timestamp}.{format}",
                },
                theme: {
                    type: "string",
                    enum: ["default", "dark", "forest", "neutral"],
                    description: "Mermaid theme for PNG/SVG rendering. Default: 'default'.",
                },
            },
            required: [],
            additionalProperties: false,
        },
        function: async (input) => {
            const rootDir = (input.root_dir || process.cwd()).trim() || process.cwd();
            const rootAbs = path.resolve(rootDir);
            const direction = (input.direction || "LR");
            const grouping = (input.grouping || "auto");
            const includeTests = Boolean(input.include_tests);
            const maxFiles = Math.min(Math.max(input.max_files ?? 400, 10), 5000);
            const maxEdges = Math.min(Math.max(input.max_edges ?? 60, 10), 500);
            const maxEntrypoints = Math.min(Math.max(input.max_entrypoints ?? 3, 1), 10);
            const showCounts = Boolean(input.show_edge_counts);
            const maxFileBytes = 250_000;
            // Output format handling - output_format takes precedence over render_ascii
            const outputFormat = input.output_format || (input.render_ascii === false ? "ascii" : "ascii");
            const renderAscii = outputFormat === "ascii" && input.render_ascii !== false;
            const theme = input.theme || "default";
            if (!(await pathExists(rootAbs))) {
                return `Error: root_dir does not exist: ${rootAbs}`;
            }
            const { files, truncated } = await collectFiles(rootAbs, {
                maxFiles,
                maxFileBytes,
                includeTests,
            });
            if (files.length === 0) {
                return `No source files found under ${rootAbs} (extensions: ${Array.from(defaultExtensions).join(", ")}).`;
            }
            const recordsByAbs = new Map();
            for (const f of files) {
                const group = groupForPath(f.relPath, grouping);
                const updated = { ...f, group };
                recordsByAbs.set(updated.absPath, updated);
            }
            const groupEdgeCounts = new Map();
            const entryEdgeSet = new Set();
            // Process files in parallel batches to avoid overwhelming the system
            const BATCH_SIZE = 50;
            const allFileRecords = Array.from(recordsByAbs.values());
            for (let i = 0; i < allFileRecords.length; i += BATCH_SIZE) {
                const batch = allFileRecords.slice(i, i + BATCH_SIZE);
                await Promise.all(batch.map(async (file) => {
                    let content;
                    try {
                        content = await readFile(file.absPath, "utf8");
                    }
                    catch {
                        return;
                    }
                    if (!content || isProbablyBinaryFile(content))
                        return;
                    const specs = parseImports(file.relPath, content);
                    // Resolve all imports for this file in parallel
                    const resolvedImports = await Promise.all(specs.map(spec => resolveLocalImport(rootAbs, file.absPath, file.relPath, spec)));
                    for (const resolved of resolvedImports) {
                        if (!resolved)
                            continue;
                        const target = recordsByAbs.get(path.resolve(resolved));
                        if (!target)
                            continue;
                        const fromGroup = file.group;
                        const toGroup = target.group;
                        if (!fromGroup || !toGroup || fromGroup === toGroup)
                            continue;
                        const key = `${fromGroup}→${toGroup}`;
                        groupEdgeCounts.set(key, (groupEdgeCounts.get(key) || 0) + 1);
                    }
                }));
            }
            const entryFiles = pickEntrypoints(Array.from(recordsByAbs.values()), maxEntrypoints);
            const entryRelPaths = entryFiles.map((f) => f.relPath);
            // Process entrypoints in parallel
            await Promise.all(entryFiles.map(async (ep) => {
                let content;
                try {
                    content = await readFile(ep.absPath, "utf8");
                }
                catch {
                    return;
                }
                if (!content || isProbablyBinaryFile(content))
                    return;
                const specs = parseImports(ep.relPath, content);
                // Resolve all imports for this entrypoint in parallel
                const resolvedImports = await Promise.all(specs.map(spec => resolveLocalImport(rootAbs, ep.absPath, ep.relPath, spec)));
                for (const resolved of resolvedImports) {
                    if (!resolved)
                        continue;
                    const target = recordsByAbs.get(path.resolve(resolved));
                    if (!target)
                        continue;
                    const toGroup = target.group;
                    if (!toGroup || toGroup === ep.group)
                        continue;
                    entryEdgeSet.add(`${ep.relPath}→${toGroup}`);
                }
            }));
            const groupEdges = Array.from(groupEdgeCounts.entries())
                .map(([k, weight]) => {
                const [from, to] = k.split("→");
                return { from, to, weight };
            })
                .sort((a, b) => b.weight - a.weight)
                .slice(0, maxEdges);
            const entryEdges = Array.from(entryEdgeSet)
                .map((k) => {
                const [from, to] = k.split("→");
                return { from, to };
            })
                .sort((a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to));
            const groups = uniq(Array.from(recordsByAbs.values()).map((f) => f.group))
                .filter(Boolean)
                .sort((a, b) => a.localeCompare(b));
            const diagram = formatMermaidFlowchart({
                direction,
                entrypoints: entryRelPaths,
                groups,
                entryEdges,
                groupEdges,
                showCounts,
            });
            const notes = [];
            notes.push(`Scanned: ${files.length} file(s) under ${safeRelPath(process.cwd(), rootAbs) || rootAbs}`);
            if (truncated)
                notes.push(`Note: file scan hit max_files=${maxFiles}`);
            notes.push(`Grouping: ${grouping}`);
            notes.push(`Edges: ${groupEdges.length} group edge(s), ${entryEdges.length} entry edge(s)`);
            // Handle PNG/SVG image rendering
            if (outputFormat === "png" || outputFormat === "svg") {
                const timestamp = Date.now();
                const defaultPath = path.join(process.cwd(), "diagrams", `diagram-${timestamp}.${outputFormat}`);
                const outputPath = input.output_path || defaultPath;
                const imageResult = await renderMermaidToImage(diagram, outputPath, {
                    format: outputFormat,
                    theme,
                    backgroundColor: theme === "dark" ? "#1e1e1e" : "white",
                });
                if (imageResult.success && imageResult.path) {
                    notes.push(`Rendered: ${outputFormat.toUpperCase()} image`);
                    notes.push(`Theme: ${theme}`);
                    notes.push(`Output: ${imageResult.path}`);
                    return `${notes.join("\n")}\n\n✓ Diagram generated successfully!\n  Path: ${imageResult.path}\n  Format: ${outputFormat.toUpperCase()}\n  Theme: ${theme}\n\nTo view the diagram, open the file in an image viewer or browser.`;
                }
                else {
                    notes.push(`Error: Image rendering failed - ${imageResult.error || "unknown error"}`);
                    notes.push(`Falling back to raw Mermaid code output.`);
                    return `${notes.join("\n")}\n\n${diagram}\n\nNote: You can paste this Mermaid code into https://mermaid.live to view the diagram.`;
                }
            }
            // Optionally render as ASCII art
            if (renderAscii) {
                const asciiResult = await renderMermaidToAscii(diagram);
                if (asciiResult.success && asciiResult.ascii) {
                    notes.push(`Rendered: ASCII art (via mermaid-ascii)`);
                    return `${notes.join("\n")}\n\n${asciiResult.ascii}\n`;
                }
                else {
                    // Fallback: include both error message and raw mermaid
                    notes.push(`Note: ASCII rendering unavailable - ${asciiResult.error || "unknown error"}`);
                    return `${notes.join("\n")}\n\n${diagram}\n`;
                }
            }
            return `${notes.join("\n")}\n\n${diagram}\n`;
        },
    },
];
