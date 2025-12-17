import { readdir, readFile, stat } from "fs/promises";
import path from "path";
import { ToolDefinition, GenerateMermaidDiagramInput } from "../types.js";
import {
  renderMermaidToAscii,
  formatDiagramResult,
} from "../../utils/diagram-renderer.js";

type GroupingMode = "auto" | "directory" | "file";
type Direction = "TB" | "TD" | "LR" | "RL";

type FileRecord = {
  absPath: string;
  relPath: string;
  group: string;
  ext: string;
};

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

function safeRelPath(rootAbs: string, absPath: string): string {
  const rel = path.relative(rootAbs, absPath);
  return rel.split(path.sep).join("/");
}

function isProbablyBinaryFile(content: string): boolean {
  return content.includes("\u0000");
}

function groupForPath(relPath: string, mode: GroupingMode): string {
  if (mode === "file") return relPath;

  const parts = relPath.split("/");
  if (parts.length === 0) return relPath;

  if (mode === "directory") {
    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : parts[0];
  }

  // auto
  if (parts[0] === "src" && parts.length >= 2) return `src/${parts[1]}`;
  if (parts[0] === "tests" && parts.length >= 2) return `tests/${parts[1]}`;
  return parts[0];
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

function uniq<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function parseImports(relPath: string, content: string): string[] {
  const ext = path.extname(relPath).toLowerCase();
  const imports: string[] = [];

  if (ext === ".ts" || ext === ".tsx" || ext === ".js" || ext === ".jsx" || ext === ".mjs" || ext === ".cjs") {
    const fromImport = /\bimport\s+[\s\S]*?\s+from\s+["']([^"']+)["']/g;
    const sideEffectImport = /\bimport\s+["']([^"']+)["']/g;
    const requireImport = /\brequire\(\s*["']([^"']+)["']\s*\)/g;
    const dynamicImport = /\bimport\(\s*["']([^"']+)["']\s*\)/g;

    for (const regex of [fromImport, sideEffectImport, requireImport, dynamicImport]) {
      let match: RegExpExecArray | null;
      while ((match = regex.exec(content))) {
        imports.push(match[1]);
      }
    }

    return uniq(imports);
  }

  if (ext === ".py") {
    const fromImport = /^\s*from\s+([.\w]+)\s+import\s+/gm;
    const directImport = /^\s*import\s+([.\w]+)(?:\s+as\s+\w+)?/gm;

    let match: RegExpExecArray | null;
    while ((match = fromImport.exec(content))) imports.push(match[1]);
    while ((match = directImport.exec(content))) imports.push(match[1]);

    return uniq(imports);
  }

  if (ext === ".java") {
    const javaImport = /^\s*import\s+([\w.]+)\s*;/gm;
    let match: RegExpExecArray | null;
    while ((match = javaImport.exec(content))) imports.push(match[1]);
    return uniq(imports);
  }

  return [];
}

function resolveJsTsImportCandidates(importPath: string): { raw: string; withoutExt: string; ext: string } {
  const ext = path.extname(importPath);
  const withoutExt = ext ? importPath.slice(0, -ext.length) : importPath;
  return { raw: importPath, withoutExt, ext };
}

function jsTsExtensionsToTry(importExt: string): string[] {
  const normalized = importExt.toLowerCase();
  if (normalized === ".js") return [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
  if (normalized === ".jsx") return [".tsx", ".jsx", ".ts", ".js"];
  if (normalized === ".mjs") return [".mts", ".mjs", ".ts", ".js"];
  if (normalized === ".cjs") return [".cts", ".cjs", ".ts", ".js"];
  if (normalized === ".ts") return [".ts", ".tsx"];
  if (normalized === ".tsx") return [".tsx"];
  return [normalized];
}

async function resolveLocalImport(
  rootAbs: string,
  fromAbs: string,
  fromRel: string,
  spec: string
): Promise<string | null> {
  const fromExt = path.extname(fromRel).toLowerCase();

  if (fromExt === ".py") {
    if (!spec.startsWith(".")) return null;
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
    for (const abs of candidates) {
      if (await pathExists(abs)) return path.resolve(abs);
    }
    return null;
  }

  // JS/TS resolution (handles ".js" imports in TS source)
  if (!spec.startsWith(".")) return null;
  const fromDir = path.dirname(fromAbs);
  const rawCandidate = path.resolve(fromDir, spec);

  const { withoutExt, ext } = resolveJsTsImportCandidates(rawCandidate);
  const extensions = ext ? jsTsExtensionsToTry(ext) : Array.from(defaultExtensions);

  const fileCandidates: string[] = [];
  if (ext) {
    fileCandidates.push(rawCandidate);
  }
  for (const tryExt of extensions) {
    fileCandidates.push(withoutExt + tryExt);
    fileCandidates.push(path.join(withoutExt, "index" + tryExt));
  }

  for (const abs of uniq(fileCandidates)) {
    if (await pathExists(abs)) return path.resolve(abs);
  }

  return null;
}

function pickEntrypoints(files: FileRecord[], maxEntrypoints: number): FileRecord[] {
  const score = (relPath: string): number => {
    const base = path.posix.basename(relPath).toLowerCase();
    const dir = path.posix.dirname(relPath);

    let points = 0;
    if (dir === ".") points += 8;
    if (dir === "src") points += 6;
    if (dir.startsWith("src/")) points += 3;

    if (base.startsWith("index.")) points += 8;
    if (base.startsWith("main.")) points += 7;
    if (base.startsWith("app.")) points += 6;
    if (base.startsWith("server.")) points += 6;
    if (base.startsWith("cli.")) points += 6;

    return points;
  };

  return files
    .slice()
    .sort((a, b) => score(b.relPath) - score(a.relPath))
    .slice(0, Math.max(1, maxEntrypoints));
}

function mermaidIdFactory(prefix: string) {
  let i = 0;
  const map = new Map<string, string>();
  return (label: string): string => {
    const existing = map.get(label);
    if (existing) return existing;
    i += 1;
    const id = `${prefix}${i}`;
    map.set(label, id);
    return id;
  };
}

function formatMermaidFlowchart(params: {
  direction: Direction;
  entrypoints: string[];
  groups: string[];
  entryEdges: Array<{ from: string; to: string }>;
  groupEdges: Array<{ from: string; to: string; weight: number }>;
  showCounts: boolean;
}): string {
  const entryId = mermaidIdFactory("E");
  const groupId = mermaidIdFactory("M");

  const lines: string[] = [];
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

async function collectFiles(rootAbs: string, opts: {
  maxFiles: number;
  maxFileBytes: number;
  includeTests: boolean;
}): Promise<{ files: FileRecord[]; truncated: boolean }> {
  const stack: string[] = [rootAbs];
  const records: FileRecord[] = [];
  let truncated = false;

  while (stack.length > 0) {
    const current = stack.pop()!;
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (records.length >= opts.maxFiles) {
        truncated = true;
        break;
      }

      const name = entry.name;
      if (name.startsWith(".")) {
        if (name !== ".github") continue;
      }

      const absPath = path.join(current, name);

      if (entry.isDirectory()) {
        if (defaultIgnoredDirs.has(name)) continue;
        if (!opts.includeTests && (name === "tests" || name === "test" || name === "__tests__")) continue;
        stack.push(absPath);
        continue;
      }

      if (!entry.isFile()) continue;
      if (defaultIgnoredFiles.has(name)) continue;

      const ext = path.extname(name).toLowerCase();
      if (!defaultExtensions.has(ext)) continue;

      let size = 0;
      try {
        size = (await stat(absPath)).size;
      } catch {
        continue;
      }
      if (size > opts.maxFileBytes) continue;

      const relPath = safeRelPath(rootAbs, absPath);
      records.push({
        absPath: path.resolve(absPath),
        relPath,
        group: groupForPath(relPath, "auto"),
        ext,
      });
    }

    if (records.length >= opts.maxFiles) break;
  }

  return { files: records, truncated };
}

export const diagramTools: ToolDefinition[] = [
  {
    name: "generate_mermaid_diagram",
    description:
      "Scan a local codebase and generate a Mermaid flowchart describing high-level module flow (entrypoints and directory-level dependencies).",
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
          description:
            "How to group nodes: auto (recommended), directory (2-level), or file (per-file, can be noisy).",
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
          description: "Render diagram as ASCII art in terminal (requires mermaid-ascii to be installed). Default: true.",
        },
      },
      required: [],
    },
    function: async (input: GenerateMermaidDiagramInput): Promise<string> => {
      const rootDir = (input.root_dir || process.cwd()).trim() || process.cwd();
      const rootAbs = path.resolve(rootDir);
      const direction: Direction = (input.direction || "LR") as Direction;
      const grouping: GroupingMode = (input.grouping || "auto") as GroupingMode;
      const includeTests = Boolean(input.include_tests);
      const maxFiles = Math.min(Math.max(input.max_files ?? 400, 10), 5000);
      const maxEdges = Math.min(Math.max(input.max_edges ?? 60, 10), 500);
      const maxEntrypoints = Math.min(Math.max(input.max_entrypoints ?? 3, 1), 10);
      const showCounts = Boolean(input.show_edge_counts);
      const renderAscii = input.render_ascii !== false; // Default to true
      const maxFileBytes = 250_000;

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

      const recordsByAbs = new Map<string, FileRecord>();
      for (const f of files) {
        const group = groupForPath(f.relPath, grouping);
        const updated = { ...f, group };
        recordsByAbs.set(updated.absPath, updated);
      }

      const groupEdgeCounts = new Map<string, number>();
      const entryEdgeSet = new Set<string>();

      for (const file of recordsByAbs.values()) {
        let content: string;
        try {
          content = await readFile(file.absPath, "utf8");
        } catch {
          continue;
        }
        if (!content || isProbablyBinaryFile(content)) continue;

        const specs = parseImports(file.relPath, content);
        for (const spec of specs) {
          const resolved = await resolveLocalImport(rootAbs, file.absPath, file.relPath, spec);
          if (!resolved) continue;

          const target = recordsByAbs.get(path.resolve(resolved));
          if (!target) continue;

          const fromGroup = file.group;
          const toGroup = target.group;
          if (!fromGroup || !toGroup || fromGroup === toGroup) continue;

          const key = `${fromGroup}→${toGroup}`;
          groupEdgeCounts.set(key, (groupEdgeCounts.get(key) || 0) + 1);
        }
      }

      const entryFiles = pickEntrypoints(Array.from(recordsByAbs.values()), maxEntrypoints);
      const entryRelPaths = entryFiles.map((f) => f.relPath);

      for (const ep of entryFiles) {
        let content: string;
        try {
          content = await readFile(ep.absPath, "utf8");
        } catch {
          continue;
        }
        if (!content || isProbablyBinaryFile(content)) continue;

        const specs = parseImports(ep.relPath, content);
        for (const spec of specs) {
          const resolved = await resolveLocalImport(rootAbs, ep.absPath, ep.relPath, spec);
          if (!resolved) continue;
          const target = recordsByAbs.get(path.resolve(resolved));
          if (!target) continue;

          const toGroup = target.group;
          if (!toGroup || toGroup === ep.group) continue;
          entryEdgeSet.add(`${ep.relPath}→${toGroup}`);
        }
      }

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

      const notes: string[] = [];
      notes.push(`Scanned: ${files.length} file(s) under ${safeRelPath(process.cwd(), rootAbs) || rootAbs}`);
      if (truncated) notes.push(`Note: file scan hit max_files=${maxFiles}`);
      notes.push(`Grouping: ${grouping}`);
      notes.push(`Edges: ${groupEdges.length} group edge(s), ${entryEdges.length} entry edge(s)`);

      // Optionally render as ASCII art
      if (renderAscii) {
        const asciiResult = await renderMermaidToAscii(diagram);
        if (asciiResult.success && asciiResult.ascii) {
          notes.push(`Rendered: ASCII art (via mermaid-ascii)`);
          return `${notes.join("\n")}\n\n${asciiResult.ascii}\n`;
        } else {
          // Fallback: include both error message and raw mermaid
          notes.push(`Note: ASCII rendering unavailable - ${asciiResult.error || "unknown error"}`);
          return `${notes.join("\n")}\n\n${diagram}\n`;
        }
      }

      return `${notes.join("\n")}\n\n${diagram}\n`;
    },
  },
];

