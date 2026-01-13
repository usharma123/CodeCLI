/**
 * Quality Fingerprint - Content-addressable staleness detection
 *
 * Replaces timestamp-based staleness detection with fingerprints based on:
 * - Git commit SHA and dirty state
 * - Config file hashes (pom.xml, build.gradle)
 * - Source file metadata (mtime + size for speed)
 *
 * This handles edge cases that break timestamps:
 * - git checkout/rebase (resets mtimes)
 * - CI cache restore (unpredictable mtimes)
 * - touch commands (can game staleness)
 * - cross-device builds (different timestamp precision)
 */

import * as fs from "fs"
import * as path from "path"
import * as crypto from "crypto"

// ============================================================================
// Types
// ============================================================================

export interface InputFingerprint {
  version: 1
  timestamp: string // ISO timestamp for debugging

  git: {
    sha: string // git rev-parse HEAD
    isDirty: boolean // has uncommitted changes
    dirtyHash: string | null // hash of staged/unstaged changes
  }

  configs: {
    [filename: string]: string // SHA-256 hash of config files
  }

  sources: {
    testFingerprint: string // aggregated fingerprint of test sources
    mainFingerprint: string // aggregated fingerprint of main sources
    testFileCount: number
    mainFileCount: number
  }
}

export interface FingerprintComparisonResult {
  isStale: boolean
  reasons: string[]
  details: {
    gitChanged: boolean
    dirtyStateChanged: boolean
    configsChanged: string[]
    sourcesChanged: boolean
  }
}

// ============================================================================
// File Paths
// ============================================================================

export function getFingerprintPath(projectRoot: string): string {
  return path.join(projectRoot, ".bootstrap", "quality-fingerprint.json")
}

// ============================================================================
// Hash Utilities
// ============================================================================

function hashString(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex").substring(0, 16)
}

function hashFile(filePath: string): string | null {
  try {
    const content = fs.readFileSync(filePath, "utf-8")
    return hashString(content)
  } catch {
    return null
  }
}

/**
 * Create a fast fingerprint for a file using mtime + size.
 * This is faster than hashing but still detects most changes.
 */
function fileMetadataFingerprint(filePath: string): string | null {
  try {
    const stat = fs.statSync(filePath)
    return `${stat.mtime.getTime()}:${stat.size}`
  } catch {
    return null
  }
}

// ============================================================================
// Git Operations
// ============================================================================

async function getGitSha(cwd: string): Promise<string | null> {
  try {
    const proc = Bun.spawn(["git", "rev-parse", "HEAD"], {
      cwd,
      stdout: "pipe",
      stderr: "pipe",
    })
    const output = await new Response(proc.stdout).text()
    await proc.exited
    return output.trim() || null
  } catch {
    return null
  }
}

async function getGitDirtyState(cwd: string): Promise<{ isDirty: boolean; hash: string | null }> {
  try {
    // Check for any changes (staged, unstaged, untracked)
    const statusProc = Bun.spawn(["git", "status", "--porcelain"], {
      cwd,
      stdout: "pipe",
      stderr: "pipe",
    })
    const statusOutput = await new Response(statusProc.stdout).text()
    await statusProc.exited

    const isDirty = statusOutput.trim().length > 0

    if (!isDirty) {
      return { isDirty: false, hash: null }
    }

    // Get a hash of all changes for dirty state tracking
    const diffProc = Bun.spawn(["git", "diff", "HEAD"], {
      cwd,
      stdout: "pipe",
      stderr: "pipe",
    })
    const diffOutput = await new Response(diffProc.stdout).text()
    await diffProc.exited

    // Include status in the hash to catch untracked files
    const combinedOutput = statusOutput + "\n" + diffOutput
    const hash = hashString(combinedOutput)

    return { isDirty: true, hash }
  } catch {
    return { isDirty: false, hash: null }
  }
}

// ============================================================================
// Source File Scanning
// ============================================================================

interface FileFingerprints {
  fingerprint: string
  fileCount: number
}

function collectSourceFingerprints(
  dir: string,
  pattern: RegExp,
  excludeDirs: string[] = ["target", "build", "node_modules", ".git"]
): FileFingerprints {
  const fingerprints: string[] = []
  let fileCount = 0

  const scanDir = (currentDir: string): void => {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (!excludeDirs.includes(entry.name) && !entry.name.startsWith(".")) {
            scanDir(path.join(currentDir, entry.name))
          }
        } else if (entry.isFile() && pattern.test(entry.name)) {
          const fullPath = path.join(currentDir, entry.name)
          const fp = fileMetadataFingerprint(fullPath)
          if (fp) {
            // Include relative path in fingerprint to detect file moves/renames
            const relativePath = path.relative(dir, fullPath)
            fingerprints.push(`${relativePath}:${fp}`)
            fileCount++
          }
        }
      }
    } catch {
      // Ignore errors (permission issues, etc.)
    }
  }

  if (fs.existsSync(dir)) {
    scanDir(dir)
  }

  // Sort for deterministic ordering, then hash the combined result
  fingerprints.sort()
  const combinedFingerprint = hashString(fingerprints.join("\n"))

  return { fingerprint: combinedFingerprint, fileCount }
}

// ============================================================================
// Fingerprint Operations
// ============================================================================

/**
 * Compute the current input fingerprint for a project.
 */
export async function computeFingerprint(
  projectPath: string,
  testSourceDir: string | null,
  mainSourceDir: string | null
): Promise<InputFingerprint> {
  // Git state
  const gitSha = (await getGitSha(projectPath)) || "unknown"
  const dirtyState = await getGitDirtyState(projectPath)

  // Config file hashes
  const configFiles = ["pom.xml", "build.gradle", "build.gradle.kts", "settings.gradle", "settings.gradle.kts"]
  const configs: { [key: string]: string } = {}

  for (const configFile of configFiles) {
    const configPath = path.join(projectPath, configFile)
    const hash = hashFile(configPath)
    if (hash) {
      configs[configFile] = hash
    }
  }

  // Source fingerprints
  const javaPattern = /\.java$|\.kt$/
  const testFingerprints = testSourceDir
    ? collectSourceFingerprints(testSourceDir, javaPattern)
    : { fingerprint: "empty", fileCount: 0 }

  const mainFingerprints = mainSourceDir
    ? collectSourceFingerprints(mainSourceDir, javaPattern)
    : { fingerprint: "empty", fileCount: 0 }

  return {
    version: 1,
    timestamp: new Date().toISOString(),
    git: {
      sha: gitSha,
      isDirty: dirtyState.isDirty,
      dirtyHash: dirtyState.hash,
    },
    configs,
    sources: {
      testFingerprint: testFingerprints.fingerprint,
      mainFingerprint: mainFingerprints.fingerprint,
      testFileCount: testFingerprints.fileCount,
      mainFileCount: mainFingerprints.fileCount,
    },
  }
}

/**
 * Load a stored fingerprint from disk.
 */
export function loadFingerprint(projectPath: string): InputFingerprint | null {
  const fingerprintPath = getFingerprintPath(projectPath)

  if (!fs.existsSync(fingerprintPath)) {
    return null
  }

  try {
    const data = JSON.parse(fs.readFileSync(fingerprintPath, "utf-8"))
    if (data.version === 1) {
      return data as InputFingerprint
    }
    return null
  } catch {
    return null
  }
}

/**
 * Save a fingerprint to disk.
 */
export function saveFingerprint(projectPath: string, fingerprint: InputFingerprint): void {
  const fingerprintPath = getFingerprintPath(projectPath)
  const dir = path.dirname(fingerprintPath)

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.writeFileSync(fingerprintPath, JSON.stringify(fingerprint, null, 2), "utf-8")
}

/**
 * Compare two fingerprints to determine if artifacts are stale.
 */
export function compareFingerprints(
  current: InputFingerprint,
  stored: InputFingerprint
): FingerprintComparisonResult {
  const reasons: string[] = []
  const details = {
    gitChanged: false,
    dirtyStateChanged: false,
    configsChanged: [] as string[],
    sourcesChanged: false,
  }

  // Check git SHA
  if (current.git.sha !== stored.git.sha) {
    details.gitChanged = true
    reasons.push(`Git commit changed: ${stored.git.sha.substring(0, 8)} → ${current.git.sha.substring(0, 8)}`)
  }

  // Check dirty state
  if (current.git.isDirty !== stored.git.isDirty) {
    details.dirtyStateChanged = true
    reasons.push(
      current.git.isDirty ? "Working directory now has uncommitted changes" : "Working directory is now clean"
    )
  } else if (current.git.isDirty && current.git.dirtyHash !== stored.git.dirtyHash) {
    details.dirtyStateChanged = true
    reasons.push("Uncommitted changes have been modified")
  }

  // Check config files
  const allConfigFiles = new Set([...Object.keys(current.configs), ...Object.keys(stored.configs)])
  for (const configFile of allConfigFiles) {
    const currentHash = current.configs[configFile]
    const storedHash = stored.configs[configFile]

    if (currentHash !== storedHash) {
      details.configsChanged.push(configFile)
      if (!storedHash) {
        reasons.push(`Config file added: ${configFile}`)
      } else if (!currentHash) {
        reasons.push(`Config file removed: ${configFile}`)
      } else {
        reasons.push(`Config file changed: ${configFile}`)
      }
    }
  }

  // Check source fingerprints
  if (
    current.sources.testFingerprint !== stored.sources.testFingerprint ||
    current.sources.mainFingerprint !== stored.sources.mainFingerprint
  ) {
    details.sourcesChanged = true

    if (current.sources.testFingerprint !== stored.sources.testFingerprint) {
      const fileDelta = current.sources.testFileCount - stored.sources.testFileCount
      if (fileDelta !== 0) {
        reasons.push(`Test sources changed (${fileDelta > 0 ? "+" : ""}${fileDelta} files)`)
      } else {
        reasons.push("Test sources modified")
      }
    }

    if (current.sources.mainFingerprint !== stored.sources.mainFingerprint) {
      const fileDelta = current.sources.mainFileCount - stored.sources.mainFileCount
      if (fileDelta !== 0) {
        reasons.push(`Main sources changed (${fileDelta > 0 ? "+" : ""}${fileDelta} files)`)
      } else {
        reasons.push("Main sources modified")
      }
    }
  }

  const isStale =
    details.gitChanged ||
    details.dirtyStateChanged ||
    details.configsChanged.length > 0 ||
    details.sourcesChanged

  return { isStale, reasons, details }
}

/**
 * High-level function to check if artifacts are stale using fingerprints.
 * Returns null if fingerprint-based detection is not available (no stored fingerprint).
 */
export async function checkFingerprintStaleness(
  projectPath: string,
  testSourceDir: string | null,
  mainSourceDir: string | null
): Promise<FingerprintComparisonResult | null> {
  const stored = loadFingerprint(projectPath)

  if (!stored) {
    // No stored fingerprint - can't determine staleness via fingerprint
    return null
  }

  const current = await computeFingerprint(projectPath, testSourceDir, mainSourceDir)
  return compareFingerprints(current, stored)
}
