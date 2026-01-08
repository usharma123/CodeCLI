/**
 * Quality Baseline - Track metrics over time and detect drift
 *
 * Manages quality baselines to detect regressions like:
 * - Deleted tests
 * - Coverage drops
 * - Suspicious changes (coverage stable despite test removals)
 */

import * as fs from "fs"
import * as path from "path"
import type { ClassCoverage, AggregateCoverage, AggregateTestResults } from "./quality-parsers"

// ============================================================================
// Types
// ============================================================================

export interface QualityBaseline {
  version: 1
  timestamp: string
  commit?: string
  projectPath?: string

  metrics: {
    totalTests: number
    passedTests: number
    failedTests: number
    skippedTests: number

    coverage: {
      line: { percent: number; covered: number; total: number }
      branch: { percent: number; covered: number; total: number }
      instruction: { percent: number; covered: number; total: number }
      method: { percent: number; covered: number; total: number }
    }

    perClass: {
      [fullClassName: string]: {
        line: number
        branch: number
        instruction: number
      }
    }

    testClasses: string[]
    slowTests: { name: string; className: string; time: number }[]
  }
}

export interface QualityConfig {
  gates: {
    min_line_coverage: number
    min_branch_coverage: number
    max_test_drop: number
    max_slow_test_ms: number
  }
  ignorePatterns: string[]
}

export interface QualityWarning {
  level: "critical" | "warning" | "info"
  code: string
  message: string
  details?: string
}

export interface QualityDiff {
  testsDelta: number
  testsRemoved: string[]
  testsAdded: string[]

  coverageDelta: {
    line: number
    branch: number
    instruction: number
  }

  classChanges: {
    fullName: string
    lineDelta: number
    branchDelta: number
    wasRemoved: boolean
    wasAdded: boolean
  }[]

  newSlowTests: { name: string; className: string; time: number }[]
  warnings: QualityWarning[]
}

export interface GateResult {
  passed: boolean
  failures: string[]
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: QualityConfig = {
  gates: {
    min_line_coverage: 70,
    min_branch_coverage: 60,
    max_test_drop: 0,
    max_slow_test_ms: 5000,
  },
  ignorePatterns: ["**/config/**", "**/*Application.java"],
}

// ============================================================================
// File Paths
// ============================================================================

export function getBaselinePath(projectRoot: string): string {
  return path.join(projectRoot, ".bootstrap", "quality-baseline.json")
}

export function getConfigPath(projectRoot: string): string {
  return path.join(projectRoot, ".bootstrap", "quality-config.json")
}

// ============================================================================
// Configuration Management
// ============================================================================

export function loadConfig(projectRoot: string): QualityConfig {
  const configPath = getConfigPath(projectRoot)

  if (fs.existsSync(configPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(configPath, "utf-8"))
      return { ...DEFAULT_CONFIG, ...data }
    } catch {
      // Use defaults
    }
  }

  return DEFAULT_CONFIG
}

export function saveConfig(projectRoot: string, config: QualityConfig): void {
  const configPath = getConfigPath(projectRoot)
  const dir = path.dirname(configPath)

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8")
}

// ============================================================================
// Baseline Management
// ============================================================================

export function loadBaseline(projectRoot: string): QualityBaseline | null {
  const baselinePath = getBaselinePath(projectRoot)

  if (!fs.existsSync(baselinePath)) {
    return null
  }

  try {
    return JSON.parse(fs.readFileSync(baselinePath, "utf-8"))
  } catch {
    return null
  }
}

export function saveBaseline(projectRoot: string, baseline: QualityBaseline): void {
  const baselinePath = getBaselinePath(projectRoot)
  const dir = path.dirname(baselinePath)

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.writeFileSync(baselinePath, JSON.stringify(baseline, null, 2), "utf-8")
}

export async function getCurrentCommit(cwd: string): Promise<string | undefined> {
  try {
    const proc = Bun.spawn(["git", "rev-parse", "HEAD"], {
      cwd,
      stdout: "pipe",
      stderr: "pipe",
    })
    const output = await new Response(proc.stdout).text()
    const exitCode = await proc.exited

    if (exitCode === 0) {
      return output.trim().substring(0, 8)
    }
  } catch {
    // Ignore
  }
  return undefined
}

// ============================================================================
// Baseline Creation
// ============================================================================

export async function createBaseline(
  projectRoot: string,
  testResults: AggregateTestResults,
  coverageData: ClassCoverage[],
  aggregateCov: AggregateCoverage,
): Promise<QualityBaseline> {
  const commit = await getCurrentCommit(projectRoot)

  const perClass: QualityBaseline["metrics"]["perClass"] = {}
  for (const cls of coverageData) {
    perClass[cls.fullName] = {
      line: cls.line.percent,
      branch: cls.branch.percent,
      instruction: cls.instruction.percent,
    }
  }

  const testClasses = testResults.suites.map((s) => s.name).filter((n) => n.includes("Test"))

  const baseline: QualityBaseline = {
    version: 1,
    timestamp: new Date().toISOString(),
    commit,
    projectPath: projectRoot,
    metrics: {
      totalTests: testResults.total,
      passedTests: testResults.passed,
      failedTests: testResults.failed,
      skippedTests: testResults.skipped,
      coverage: {
        line: {
          percent: aggregateCov.line.percent,
          covered: aggregateCov.line.covered,
          total: aggregateCov.line.missed + aggregateCov.line.covered,
        },
        branch: {
          percent: aggregateCov.branch.percent,
          covered: aggregateCov.branch.covered,
          total: aggregateCov.branch.missed + aggregateCov.branch.covered,
        },
        instruction: {
          percent: aggregateCov.instruction.percent,
          covered: aggregateCov.instruction.covered,
          total: aggregateCov.instruction.missed + aggregateCov.instruction.covered,
        },
        method: {
          percent: aggregateCov.method.percent,
          covered: aggregateCov.method.covered,
          total: aggregateCov.method.missed + aggregateCov.method.covered,
        },
      },
      perClass,
      testClasses,
      slowTests: testResults.slowTests.slice(0, 10),
    },
  }

  return baseline
}

// ============================================================================
// Diff Calculation
// ============================================================================

export function computeDiff(current: QualityBaseline, previous: QualityBaseline | null, config: QualityConfig): QualityDiff {
  const warnings: QualityWarning[] = []

  if (!previous) {
    return {
      testsDelta: 0,
      testsRemoved: [],
      testsAdded: current.metrics.testClasses,
      coverageDelta: { line: 0, branch: 0, instruction: 0 },
      classChanges: [],
      newSlowTests: [],
      warnings: [
        {
          level: "info",
          code: "FIRST_RUN",
          message: "First baseline recorded - no previous data to compare",
        },
      ],
    }
  }

  // Test count changes
  const testsDelta = current.metrics.totalTests - previous.metrics.totalTests

  // Find removed and added test classes
  const prevTestSet = new Set(previous.metrics.testClasses)
  const currTestSet = new Set(current.metrics.testClasses)

  const testsRemoved = previous.metrics.testClasses.filter((t) => !currTestSet.has(t))
  const testsAdded = current.metrics.testClasses.filter((t) => !prevTestSet.has(t))

  // Coverage deltas
  const coverageDelta = {
    line: current.metrics.coverage.line.percent - previous.metrics.coverage.line.percent,
    branch: current.metrics.coverage.branch.percent - previous.metrics.coverage.branch.percent,
    instruction: current.metrics.coverage.instruction.percent - previous.metrics.coverage.instruction.percent,
  }

  // Per-class changes
  const classChanges: QualityDiff["classChanges"] = []
  const allClasses = new Set([...Object.keys(current.metrics.perClass), ...Object.keys(previous.metrics.perClass)])

  for (const fullName of allClasses) {
    const curr = current.metrics.perClass[fullName]
    const prev = previous.metrics.perClass[fullName]

    if (!curr && prev) {
      classChanges.push({
        fullName,
        lineDelta: -prev.line,
        branchDelta: -prev.branch,
        wasRemoved: true,
        wasAdded: false,
      })
    } else if (curr && !prev) {
      classChanges.push({
        fullName,
        lineDelta: curr.line,
        branchDelta: curr.branch,
        wasRemoved: false,
        wasAdded: true,
      })
    } else if (curr && prev) {
      const lineDelta = curr.line - prev.line
      const branchDelta = curr.branch - prev.branch

      if (Math.abs(lineDelta) > 1 || Math.abs(branchDelta) > 1) {
        classChanges.push({
          fullName,
          lineDelta,
          branchDelta,
          wasRemoved: false,
          wasAdded: false,
        })
      }
    }
  }

  classChanges.sort((a, b) => Math.abs(b.lineDelta) - Math.abs(a.lineDelta))

  // Slow test changes
  const prevSlowNames = new Set(previous.metrics.slowTests.map((t) => `${t.className}.${t.name}`))
  const newSlowTests = current.metrics.slowTests.filter(
    (t) => !prevSlowNames.has(`${t.className}.${t.name}`) && t.time * 1000 > config.gates.max_slow_test_ms,
  )

  // Generate warnings

  if (testsRemoved.length > 0) {
    warnings.push({
      level: "critical",
      code: "TESTS_REMOVED",
      message: `${testsRemoved.length} test class(es) were REMOVED`,
      details: testsRemoved.join(", "),
    })
  }

  if (testsDelta < -config.gates.max_test_drop) {
    warnings.push({
      level: "critical",
      code: "TEST_COUNT_DROP",
      message: `Test count dropped by ${Math.abs(testsDelta)} (threshold: ${config.gates.max_test_drop})`,
      details: `Was ${previous.metrics.totalTests}, now ${current.metrics.totalTests}`,
    })
  }

  if (current.metrics.coverage.line.percent < config.gates.min_line_coverage) {
    warnings.push({
      level: "warning",
      code: "LINE_COVERAGE_BELOW_GATE",
      message: `Line coverage ${current.metrics.coverage.line.percent.toFixed(1)}% is below gate (${config.gates.min_line_coverage}%)`,
    })
  }

  if (current.metrics.coverage.branch.percent < config.gates.min_branch_coverage) {
    warnings.push({
      level: "warning",
      code: "BRANCH_COVERAGE_BELOW_GATE",
      message: `Branch coverage ${current.metrics.coverage.branch.percent.toFixed(1)}% is below gate (${config.gates.min_branch_coverage}%)`,
    })
  }

  if (coverageDelta.line < -5) {
    warnings.push({
      level: "warning",
      code: "LINE_COVERAGE_DROP",
      message: `Line coverage dropped by ${Math.abs(coverageDelta.line).toFixed(1)}%`,
    })
  }

  // Suspicious: tests dropped but coverage stable
  if (testsDelta < -2 && Math.abs(coverageDelta.line) < 2) {
    warnings.push({
      level: "warning",
      code: "SUSPICIOUS_STABLE_COVERAGE",
      message: "Tests removed but coverage barely changed - verify no low-value tests deleted",
      details: `${Math.abs(testsDelta)} tests removed, line coverage changed only ${coverageDelta.line.toFixed(1)}%`,
    })
  }

  // Suspicious: large coverage jump without test additions
  if (coverageDelta.line > 10 && testsAdded.length === 0) {
    warnings.push({
      level: "warning",
      code: "SUSPICIOUS_COVERAGE_JUMP",
      message: "Large coverage increase without new tests - verify code wasn't deleted",
      details: `Line coverage increased ${coverageDelta.line.toFixed(1)}% with no new test classes`,
    })
  }

  if (newSlowTests.length > 0) {
    warnings.push({
      level: "info",
      code: "NEW_SLOW_TESTS",
      message: `${newSlowTests.length} new slow test(s) detected (>${config.gates.max_slow_test_ms}ms)`,
      details: newSlowTests.map((t) => `${t.className}.${t.name}: ${(t.time * 1000).toFixed(0)}ms`).join(", "),
    })
  }

  if (testsAdded.length > 0) {
    warnings.push({
      level: "info",
      code: "TESTS_ADDED",
      message: `${testsAdded.length} new test class(es) added`,
      details: testsAdded.join(", "),
    })
  }

  return {
    testsDelta,
    testsRemoved,
    testsAdded,
    coverageDelta,
    classChanges,
    newSlowTests,
    warnings,
  }
}

// ============================================================================
// Gate Evaluation
// ============================================================================

export function evaluateGates(current: QualityBaseline, diff: QualityDiff, config: QualityConfig): GateResult {
  const failures: string[] = []

  if (current.metrics.coverage.line.percent < config.gates.min_line_coverage) {
    failures.push(`Line coverage ${current.metrics.coverage.line.percent.toFixed(1)}% < ${config.gates.min_line_coverage}%`)
  }

  if (current.metrics.coverage.branch.percent < config.gates.min_branch_coverage) {
    failures.push(`Branch coverage ${current.metrics.coverage.branch.percent.toFixed(1)}% < ${config.gates.min_branch_coverage}%`)
  }

  if (diff.testsDelta < -config.gates.max_test_drop) {
    failures.push(`Test count dropped by ${Math.abs(diff.testsDelta)} (max allowed: ${config.gates.max_test_drop})`)
  }

  const criticalWarnings = diff.warnings.filter((w) => w.level === "critical")
  for (const w of criticalWarnings) {
    failures.push(`[${w.code}] ${w.message}`)
  }

  return {
    passed: failures.length === 0,
    failures,
  }
}
