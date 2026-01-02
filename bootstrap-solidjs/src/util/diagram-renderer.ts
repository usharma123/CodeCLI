/**
 * Pure TypeScript ASCII Diagram Renderer
 * Renders Mermaid flowchart syntax as ASCII art using Unicode box-drawing characters
 * No external dependencies required
 */

// Unicode box-drawing characters
const BOX = {
  topLeft: "┌",
  topRight: "┐",
  bottomLeft: "└",
  bottomRight: "┘",
  horizontal: "─",
  vertical: "│",
  arrowDown: "▼",
  arrowRight: "▶",
  arrowLeft: "◀",
  arrowUp: "▲",
  teeDown: "┬",
  teeUp: "┴",
  teeRight: "├",
  teeLeft: "┤",
  cross: "┼",
}

interface Node {
  id: string
  label: string
  x: number
  y: number
  width: number
  height: number
}

interface Edge {
  from: string
  to: string
  label?: string
}

interface ParsedDiagram {
  direction: "TB" | "TD" | "LR" | "RL"
  nodes: Map<string, Node>
  edges: Edge[]
  subgraphs: Map<string, string[]>
}

/**
 * Result of attempting to render a Mermaid diagram to ASCII
 */
export interface DiagramRenderResult {
  success: boolean
  ascii?: string
  error?: string
  fallbackMermaid?: string
}

/**
 * Extract raw Mermaid code from a string that may contain markdown code blocks
 */
export function extractMermaidCode(content: string): string {
  const mermaidBlockMatch = content.match(/```mermaid\s*([\s\S]*?)```/)
  if (mermaidBlockMatch) {
    return mermaidBlockMatch[1].trim()
  }
  return content.trim()
}

/**
 * Check if the Mermaid code is a supported diagram type
 */
export function isSupportedDiagramType(mermaidCode: string): boolean {
  const trimmed = mermaidCode.trim().toLowerCase()
  return trimmed.startsWith("graph ") || trimmed.startsWith("flowchart ")
}

/**
 * Parse Mermaid flowchart syntax
 */
function parseMermaidFlowchart(code: string): ParsedDiagram {
  const lines = code
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("%%"))
  const nodes = new Map<string, Node>()
  const edges: Edge[] = []
  const subgraphs = new Map<string, string[]>()
  let direction: "TB" | "TD" | "LR" | "RL" = "TB"
  let currentSubgraph: string | null = null

  for (const line of lines) {
    // Parse direction
    const dirMatch = line.match(/^(?:graph|flowchart)\s+(TB|TD|LR|RL)/i)
    if (dirMatch) {
      direction = dirMatch[1].toUpperCase() as "TB" | "TD" | "LR" | "RL"
      continue
    }

    // Parse subgraph
    if (line.toLowerCase().startsWith("subgraph ")) {
      const subMatch = line.match(/subgraph\s+(\w+)(?:\s+\[([^\]]+)\])?/i)
      if (subMatch) {
        currentSubgraph = subMatch[2] || subMatch[1]
        subgraphs.set(currentSubgraph, [])
      }
      continue
    }

    if (line.toLowerCase() === "end") {
      currentSubgraph = null
      continue
    }

    // Parse node definitions: id["label"] or id[label]
    const nodeMatch = line.match(/^\s*(\w+)\s*\["?([^"\]]+)"?\]/)
    if (nodeMatch && !line.includes("-->") && !line.includes("---")) {
      const [, id, label] = nodeMatch
      if (!nodes.has(id)) {
        nodes.set(id, {
          id,
          label: label || id,
          x: 0,
          y: 0,
          width: 0,
          height: 3,
        })
      }
      if (currentSubgraph) {
        const group = subgraphs.get(currentSubgraph) || []
        group.push(id)
        subgraphs.set(currentSubgraph, group)
      }
      continue
    }

    // Parse edges: A --> B or A -->|label| B
    const edgeMatch = line.match(/(\w+)\s*-->\s*(?:\|([^|]+)\|)?\s*(\w+)/)
    if (edgeMatch) {
      const [, from, label, to] = edgeMatch
      edges.push({ from, to, label })

      // Auto-create nodes if they don't exist
      if (!nodes.has(from)) {
        nodes.set(from, { id: from, label: from, x: 0, y: 0, width: 0, height: 3 })
      }
      if (!nodes.has(to)) {
        nodes.set(to, { id: to, label: to, x: 0, y: 0, width: 0, height: 3 })
      }
    }
  }

  return { direction, nodes, edges, subgraphs }
}

/**
 * Create a box with text inside
 */
function createBox(label: string, minWidth: number = 0): string[] {
  const padding = 1
  const width = Math.max(label.length + padding * 2, minWidth)
  const top = BOX.topLeft + BOX.horizontal.repeat(width) + BOX.topRight
  const middle = BOX.vertical + " " + label.padEnd(width - 1) + BOX.vertical
  const bottom = BOX.bottomLeft + BOX.horizontal.repeat(width) + BOX.bottomRight
  return [top, middle, bottom]
}

/**
 * Simple layout algorithm for flowchart nodes
 */
function layoutNodes(diagram: ParsedDiagram): void {
  const { nodes, edges, direction } = diagram
  const isVertical = direction === "TB" || direction === "TD"

  // Calculate node widths based on labels
  for (const node of nodes.values()) {
    node.width = node.label.length + 4 // padding for box borders
  }

  // Group nodes by their connectivity level (simple BFS-based layering)
  const levels = new Map<string, number>()
  const roots = new Set(nodes.keys())

  for (const edge of edges) {
    roots.delete(edge.to)
  }

  // BFS to assign levels
  const queue = [...roots]
  for (const root of queue) {
    levels.set(root, 0)
  }

  // Use Set for O(1) membership checking instead of Array.includes() O(n)
  const queued = new Set(queue)

  while (queue.length > 0) {
    const current = queue.shift()!
    queued.delete(current) // Remove from set when dequeued
    const currentLevel = levels.get(current) || 0

    for (const edge of edges) {
      if (edge.from === current) {
        const existingLevel = levels.get(edge.to)
        if (existingLevel === undefined || existingLevel < currentLevel + 1) {
          levels.set(edge.to, currentLevel + 1)
          if (!queued.has(edge.to)) {
            // O(1) lookup instead of O(n)
            queue.push(edge.to)
            queued.add(edge.to) // Add to set
          }
        }
      }
    }
  }

  // Group nodes by level
  const nodesByLevel = new Map<number, string[]>()
  for (const [nodeId, level] of levels) {
    const group = nodesByLevel.get(level) || []
    group.push(nodeId)
    nodesByLevel.set(level, group)
  }

  // Position nodes
  const nodeSpacingX = isVertical ? 20 : 25
  const nodeSpacingY = isVertical ? 6 : 4

  for (const [level, nodeIds] of nodesByLevel) {
    for (let i = 0; i < nodeIds.length; i++) {
      const node = nodes.get(nodeIds[i])!
      if (isVertical) {
        node.x = i * nodeSpacingX
        node.y = level * nodeSpacingY
      } else {
        node.x = level * nodeSpacingX
        node.y = i * nodeSpacingY
      }
    }
  }
}

/**
 * Render the diagram to ASCII art
 */
function renderToAscii(diagram: ParsedDiagram): string {
  const { nodes, edges, direction, subgraphs } = diagram

  if (nodes.size === 0) {
    return "(empty diagram)"
  }

  layoutNodes(diagram)

  // Calculate canvas size
  let maxX = 0
  let maxY = 0
  for (const node of nodes.values()) {
    maxX = Math.max(maxX, node.x + node.width + 2)
    maxY = Math.max(maxY, node.y + node.height + 2)
  }

  // Create canvas
  const canvas: string[][] = []
  for (let y = 0; y <= maxY; y++) {
    canvas.push(new Array(maxX + 10).fill(" "))
  }

  // Draw nodes
  for (const node of nodes.values()) {
    const box = createBox(node.label)
    for (let i = 0; i < box.length; i++) {
      const row = node.y + i
      if (row < canvas.length) {
        for (let j = 0; j < box[i].length; j++) {
          const col = node.x + j
          if (col < canvas[row].length) {
            canvas[row][col] = box[i][j]
          }
        }
      }
    }
  }

  // Draw edges (simplified - just arrows between adjacent levels)
  const isVertical = direction === "TB" || direction === "TD"

  for (const edge of edges) {
    const fromNode = nodes.get(edge.from)
    const toNode = nodes.get(edge.to)

    if (!fromNode || !toNode) continue

    if (isVertical) {
      // Draw vertical connection
      const startX = fromNode.x + Math.floor(fromNode.width / 2)
      const startY = fromNode.y + 3
      const endY = toNode.y - 1

      for (let y = startY; y < endY; y++) {
        if (y < canvas.length && startX < canvas[y].length) {
          canvas[y][startX] = BOX.vertical
        }
      }
      // Arrow
      if (endY < canvas.length && startX < canvas[endY].length) {
        canvas[endY][startX] = BOX.arrowDown
      }
    } else {
      // Draw horizontal connection
      const startX = fromNode.x + fromNode.width
      const startY = fromNode.y + 1
      const endX = toNode.x - 1

      for (let x = startX; x < endX; x++) {
        if (startY < canvas.length && x < canvas[startY].length) {
          canvas[startY][x] = BOX.horizontal
        }
      }
      // Arrow
      if (startY < canvas.length && endX < canvas[startY].length) {
        canvas[startY][endX] = BOX.arrowRight
      }
    }
  }

  // Add subgraph labels
  if (subgraphs.size > 0) {
    const lines: string[] = []
    lines.push("") // spacing
    for (const [name, nodeIds] of subgraphs) {
      lines.push(`[${name}]: ${nodeIds.join(", ")}`)
    }
    return (
      canvas
        .map((row) => row.join("").trimEnd())
        .join("\n") +
      "\n" +
      lines.join("\n")
    )
  }

  return canvas.map((row) => row.join("").trimEnd()).join("\n")
}

/**
 * Render Mermaid code to ASCII art
 *
 * @param mermaidCode - Raw Mermaid diagram code or markdown-wrapped code
 * @returns DiagramRenderResult with ASCII output or error/fallback
 */
export async function renderMermaidToAscii(mermaidCode: string): Promise<DiagramRenderResult> {
  const rawCode = extractMermaidCode(mermaidCode)

  if (!isSupportedDiagramType(rawCode)) {
    return {
      success: false,
      error: "Only graph/flowchart diagrams are supported for ASCII rendering",
      fallbackMermaid: rawCode,
    }
  }

  try {
    const diagram = parseMermaidFlowchart(rawCode)

    if (diagram.nodes.size === 0) {
      return {
        success: false,
        error: "No nodes found in diagram",
        fallbackMermaid: rawCode,
      }
    }

    const ascii = renderToAscii(diagram)

    return {
      success: true,
      ascii,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      error: `Failed to render diagram: ${errorMessage}`,
      fallbackMermaid: rawCode,
    }
  }
}

/**
 * Format a diagram result for display
 */
export function formatDiagramResult(result: DiagramRenderResult): string {
  if (result.success && result.ascii) {
    return result.ascii
  }

  const lines: string[] = []

  if (result.error) {
    lines.push(`Warning: ${result.error}`)
    lines.push("")
  }

  if (result.fallbackMermaid) {
    lines.push("Raw Mermaid code:")
    lines.push("```mermaid")
    lines.push(result.fallbackMermaid)
    lines.push("```")
  }

  return lines.join("\n")
}
