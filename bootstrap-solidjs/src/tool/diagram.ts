import z from "zod"
import * as path from "path"
import { readdir, readFile, stat, writeFile, mkdir } from "fs/promises"
import { spawn } from "child_process"
import { Tool } from "./tool"
import { Instance } from "../project/instance"
import { renderMermaidToAscii } from "../util/diagram-renderer"
import DESCRIPTION from "./diagram.txt"

type OutputFormat = "ascii" | "png" | "svg"
type MermaidTheme = "default" | "dark" | "forest" | "neutral"

/**
 * Render Mermaid diagram to PNG/SVG using mmdc CLI
 */
async function renderMermaidToImage(
  mermaidCode: string,
  outputPath: string,
  options: {
    format: "png" | "svg"
    theme: MermaidTheme
    backgroundColor?: string
    width?: number
    height?: number
  },
): Promise<{ success: boolean; path?: string; error?: string }> {
  const { format, theme, backgroundColor = "transparent", width = 1920, height = 1080 } = options

  // Extract the mermaid code from the markdown code block
  const codeMatch = mermaidCode.match(/```mermaid\n([\s\S]*?)\n```/)
  const pureCode = codeMatch ? codeMatch[1] : mermaidCode

  // Create temp directory for input file
  const tempDir = path.join(Instance.directory, ".diagrams-temp")
  const tempInputPath = path.join(tempDir, `input-${Date.now()}.mmd`)

  try {
    // Ensure temp directory exists
    await mkdir(tempDir, { recursive: true })

    // Write mermaid code to temp file
    await writeFile(tempInputPath, pureCode, "utf8")

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath)
    await mkdir(outputDir, { recursive: true })

    // Create config for mmdc
    const configPath = path.join(tempDir, `config-${Date.now()}.json`)
    const config = {
      theme,
      backgroundColor,
      width,
      height,
    }
    await writeFile(configPath, JSON.stringify(config), "utf8")

    // Run mmdc
    return new Promise((resolve) => {
      let resolved = false

      const args = [
        "-i",
        tempInputPath,
        "-o",
        outputPath,
        "-t",
        theme,
        "-b",
        backgroundColor,
        "-w",
        String(width),
        "-H",
        String(height),
      ]

      const mmdc = spawn("npx", ["--yes", "mmdc", ...args], {
        cwd: Instance.directory,
        stdio: ["pipe", "pipe", "pipe"],
      })

      const MAX_BUFFER_SIZE = 1024 * 1024
      let stderr = ""
      let stdout = ""

      mmdc.stdout?.on("data", (data) => {
        if (stdout.length < MAX_BUFFER_SIZE) {
          stdout += data.toString()
        }
      })

      mmdc.stderr?.on("data", (data) => {
        if (stderr.length < MAX_BUFFER_SIZE) {
          stderr += data.toString()
        }
      })

      const cleanup = async (result: { success: boolean; path?: string; error?: string }) => {
        if (!resolved) {
          resolved = true
          clearTimeout(timeoutId)

          try {
            const { unlink } = await import("fs/promises")
            await unlink(tempInputPath).catch(() => {})
            await unlink(configPath).catch(() => {})
          } catch {
            // Ignore cleanup errors
          }

          resolve(result)
        }
      }

      mmdc.on("error", (err) => {
        cleanup({
          success: false,
          error: `Failed to spawn mmdc: ${err.message}. Make sure @mermaid-js/mermaid-cli is installed.`,
        })
      })

      mmdc.on("close", async (code) => {
        if (code === 0) {
          await cleanup({
            success: true,
            path: outputPath,
          })
        } else {
          await cleanup({
            success: false,
            error: stderr || stdout || `mmdc exited with code ${code}`,
          })
        }
      })

      const timeoutId = setTimeout(() => {
        if (!resolved) {
          mmdc.kill("SIGKILL")
          cleanup({
            success: false,
            error: "Rendering timed out after 60 seconds",
          })
        }
      }, 60000)
    })
  } catch (err) {
    return {
      success: false,
      error: `Failed to prepare rendering: ${err instanceof Error ? err.message : String(err)}`,
    }
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
])

const defaultIgnoredFiles = new Set(["bun.lock", "package-lock.json", "pnpm-lock.yaml", "yarn.lock"])

const defaultExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".py", ".java"])

function safeRelPath(rootAbs: string, absPath: string): string {
  const rel = path.relative(rootAbs, absPath)
  return rel.split(path.sep).join("/")
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath)
    return true
  } catch {
    return false
  }
}

type FileInfo = {
  relPath: string
  absPath: string
  isDir: boolean
}

/**
 * Collect file paths only (no content reading) - much faster than before
 */
async function collectFilePaths(
  rootAbs: string,
  opts: { maxFiles: number; maxDepth: number; includeTests: boolean },
): Promise<{ files: FileInfo[]; truncated: boolean }> {
  const results: FileInfo[] = []
  let truncated = false

  async function traverse(dir: string, depth: number): Promise<void> {
    if (depth > opts.maxDepth || results.length >= opts.maxFiles) {
      truncated = results.length >= opts.maxFiles
      return
    }

    let entries
    try {
      entries = await readdir(dir, { withFileTypes: true })
    } catch {
      return
    }

    for (const entry of entries) {
      if (results.length >= opts.maxFiles) {
        truncated = true
        return
      }

      const name = entry.name
      if (name.startsWith(".") && name !== ".github") continue

      const absPath = path.join(dir, name)
      const relPath = safeRelPath(rootAbs, absPath)

      if (entry.isDirectory()) {
        if (defaultIgnoredDirs.has(name)) continue
        if (!opts.includeTests && (name === "tests" || name === "test" || name === "__tests__")) continue

        results.push({ relPath, absPath, isDir: true })
        await traverse(absPath, depth + 1)
      } else if (entry.isFile()) {
        if (defaultIgnoredFiles.has(name)) continue
        const ext = path.extname(name).toLowerCase()
        if (!defaultExtensions.has(ext)) continue

        results.push({ relPath, absPath, isDir: false })
      }
    }
  }

  await traverse(rootAbs, 0)
  return { files: results, truncated }
}

/**
 * Score files to find likely entrypoints
 */
function scoreEntrypoint(relPath: string): number {
  const base = path.basename(relPath).toLowerCase()
  const dir = path.dirname(relPath)

  let points = 0

  // Directory scoring
  if (dir === ".") points += 10
  else if (dir === "src") points += 8
  else if (dir.startsWith("src/")) points += 5

  // Filename scoring
  if (base.startsWith("index.")) points += 10
  if (base.startsWith("main.")) points += 9
  if (base.startsWith("app.")) points += 8
  if (base.startsWith("server.")) points += 7
  if (base.startsWith("cli.")) points += 7
  if (base.startsWith("entry.")) points += 6

  return points
}

/**
 * Format file list as a tree structure
 */
function formatAsTree(files: FileInfo[]): string {
  // Group files by directory
  const tree = new Map<string, string[]>()

  for (const file of files) {
    if (file.isDir) continue
    const dir = path.dirname(file.relPath)
    if (!tree.has(dir)) tree.set(dir, [])
    tree.get(dir)!.push(path.basename(file.relPath))
  }

  // Sort directories
  const sortedDirs = Array.from(tree.keys()).sort()

  const lines: string[] = []
  for (const dir of sortedDirs) {
    lines.push(`[dir] ${dir === "." ? "(root)" : dir}/`)
    const dirFiles = tree.get(dir)!.sort()
    for (const file of dirFiles.slice(0, 10)) {
      // Limit files per dir
      lines.push(`   [file] ${file}`)
    }
    if (dirFiles.length > 10) {
      lines.push(`   ... and ${dirFiles.length - 10} more files`)
    }
  }

  return lines.join("\n")
}

/**
 * Generate a simple Mermaid diagram from directory structure
 * This is a fallback - the LLM should generate a better one from the context
 */
function generateSimpleDiagram(files: FileInfo[], direction: string = "LR"): string {
  // Group by top-level directories
  const groups = new Map<string, number>()

  for (const file of files) {
    if (file.isDir) continue
    const parts = file.relPath.split("/")
    const group = parts[0] === "src" && parts.length > 1 ? `src/${parts[1]}` : parts[0]
    groups.set(group, (groups.get(group) || 0) + 1)
  }

  // Build diagram
  const lines: string[] = []
  lines.push("```mermaid")
  lines.push(`flowchart ${direction}`)
  lines.push("  subgraph Codebase")

  let i = 0
  const sortedGroups = Array.from(groups.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15) // Limit to top 15 groups

  for (const [group, count] of sortedGroups) {
    i++
    const safeId = `M${i}`
    const label = `${group} (${count} files)`
    lines.push(`    ${safeId}["${label}"]`)
  }

  lines.push("  end")
  lines.push("```")

  return lines.join("\n")
}

export const DiagramTool = Tool.define("diagram", {
  description: DESCRIPTION,
  parameters: z.object({
    root_dir: z.string().optional().describe("Root directory to scan (default: current working directory)"),
    direction: z
      .enum(["TB", "TD", "LR", "RL"])
      .optional()
      .describe("Mermaid flowchart direction (default: LR)"),
    include_tests: z.boolean().optional().describe("Whether to include test directories (default: false)"),
    max_files: z.number().optional().describe("Maximum number of files to list (default: 100)"),
    max_entrypoints: z.number().optional().describe("Maximum number of entrypoint files to read (default: 5)"),
    output_format: z
      .enum(["ascii", "png", "svg"])
      .optional()
      .describe("Output format: 'ascii' for terminal, 'png' or 'svg' for image files. Default: 'png'"),
    output_path: z
      .string()
      .optional()
      .describe("Custom output path for PNG/SVG files. Default: ./diagrams/diagram-{timestamp}.{format}"),
    theme: z
      .enum(["default", "dark", "forest", "neutral"])
      .optional()
      .describe("Mermaid theme for rendering. Default: 'default'"),
    mermaid_code: z
      .string()
      .optional()
      .describe("If provided, skip analysis and directly render this Mermaid code to an image"),
  }),
  async execute(params, ctx) {
    const rootDir = (params.root_dir || Instance.directory).trim() || Instance.directory
    const rootAbs = path.resolve(rootDir)
    const direction = params.direction || "LR"
    const includeTests = Boolean(params.include_tests)
    const maxFiles = Math.min(Math.max(params.max_files ?? 100, 10), 500)
    const maxEntrypoints = Math.min(Math.max(params.max_entrypoints ?? 5, 1), 10)
    const outputFormat: OutputFormat = params.output_format || "png"
    const theme: MermaidTheme = params.theme || "default"

    // If mermaid_code is provided, just render it directly
    if (params.mermaid_code) {
      const timestamp = Date.now()
      const diagramsDir = path.join(Instance.directory, "diagrams")
      const defaultPath = path.join(diagramsDir, `diagram-${timestamp}.${outputFormat === "ascii" ? "png" : outputFormat}`)
      const outputPath = params.output_path || defaultPath

      if (outputFormat === "ascii") {
        const asciiResult = await renderMermaidToAscii(params.mermaid_code)
        if (asciiResult.success && asciiResult.ascii) {
          return {
            title: "ASCII Diagram",
            metadata: { format: "ascii" },
            output: `ASCII Diagram:\n\n${asciiResult.ascii}`,
          }
        }
        return {
          title: "Diagram Error",
          metadata: { error: asciiResult.error },
          output: `Error rendering ASCII: ${asciiResult.error}\n\nRaw Mermaid code:\n${params.mermaid_code}`,
        }
      }

      const imageResult = await renderMermaidToImage(params.mermaid_code, outputPath, {
        format: outputFormat as "png" | "svg",
        theme,
        backgroundColor: theme === "dark" ? "#1e1e1e" : "white",
      })

      if (imageResult.success && imageResult.path) {
        const relPath = path.relative(Instance.directory, imageResult.path)
        return {
          title: relPath,
          metadata: { path: imageResult.path, format: outputFormat, theme },
          output: `Diagram rendered successfully!\n  Path: ${relPath}\n  Format: ${outputFormat.toUpperCase()}\n  Theme: ${theme}`,
        }
      }
      return {
        title: "Diagram Error",
        metadata: { error: imageResult.error },
        output: `Error rendering diagram: ${imageResult.error}\n\nRaw Mermaid code:\n${params.mermaid_code}`,
      }
    }

    // Validate root directory
    if (!(await pathExists(rootAbs))) {
      return {
        title: "Error",
        metadata: { error: "root_dir does not exist" },
        output: `Error: root_dir does not exist: ${rootAbs}`,
      }
    }

    // Step 1: Collect file paths (fast - no content reading)
    const { files, truncated } = await collectFilePaths(rootAbs, {
      maxFiles,
      maxDepth: 5,
      includeTests,
    })

    if (files.length === 0) {
      return {
        title: "No files found",
        metadata: { fileCount: 0 },
        output: `No source files found under ${rootAbs} (extensions: ${Array.from(defaultExtensions).join(", ")}).`,
      }
    }

    // Step 2: Find and read entrypoints
    const sourceFiles = files.filter((f) => !f.isDir)
    const scoredFiles = sourceFiles.map((f) => ({ ...f, score: scoreEntrypoint(f.relPath) })).sort((a, b) => b.score - a.score)

    const entrypoints = scoredFiles.slice(0, maxEntrypoints)

    const entrypointContents: { path: string; content: string }[] = []
    for (const ep of entrypoints) {
      try {
        const content = await readFile(ep.absPath, "utf8")
        // Only include first 100 lines to keep it manageable
        const truncatedContent = content.split("\n").slice(0, 100).join("\n")
        entrypointContents.push({ path: ep.relPath, content: truncatedContent })
      } catch {
        // Skip files that can't be read
      }
    }

    // Step 3: Format output for LLM consumption
    const fileTree = formatAsTree(files)
    const simpleDiagram = generateSimpleDiagram(files, direction)

    // Build the output
    const output: string[] = []
    output.push("# Codebase Analysis for Diagram Generation\n")
    output.push(`Scanned: ${files.length} items under ${safeRelPath(Instance.directory, rootAbs) || rootAbs}`)
    if (truncated) output.push(`(truncated at ${maxFiles} files)`)
    output.push("")

    output.push("## File Structure\n")
    output.push(fileTree)
    output.push("")

    output.push("## Key Entrypoints\n")
    for (const ep of entrypointContents) {
      output.push(`### ${ep.path}\n`)
      output.push("```typescript")
      output.push(ep.content)
      output.push("```\n")
    }

    output.push("## Auto-Generated Simple Diagram\n")
    output.push(simpleDiagram)
    output.push("")

    output.push("---")
    output.push("**To generate a PNG diagram**, call this tool again with the `mermaid_code` parameter containing your Mermaid diagram code.")
    output.push(`Output will be saved to: ./diagrams/diagram-{timestamp}.${outputFormat}`)

    return {
      title: `Analyzed ${files.length} files`,
      metadata: { fileCount: files.length, truncated, entrypoints: entrypoints.map((e) => e.relPath) },
      output: output.join("\n"),
    }
  },
})
