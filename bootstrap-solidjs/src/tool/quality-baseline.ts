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
import type { ClassCoverage, AggregateCoverage, AggregateTestResults, TestMethod, ProductionClass, ProductionMethod } from "./quality-parsers"
import { scanTestSourceFiles, scanProductionSourceFiles } from "./quality-parsers"

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
    testMethods: { [className: string]: string[] }
    slowTests: { name: string; className: string; time: number }[]

    // Production source tracking
    productionClasses?: {
      [fullClassName: string]: {
        methods: { [signature: string]: { lineNumber: number; filePath: string } }
      }
    }
  }
}

export interface QualityConfig {
  gates: {
    min_line_coverage: number
    min_branch_coverage: number
    max_test_drop: number
    max_test_drop_percent?: number // Optional: percentage-based test drop tolerance
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

  // Adjusted coverage - penalizes raw coverage when tests are deleted
  adjustedCoverage?: {
    line: number
    branch: number
    instruction: number
    testRetentionRatio: number // currentTests / baselineTests
    penalty: string // e.g., "47.8% of raw coverage (65/136 tests)"
    reason: string
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

  // Source file-based detection (works without artifacts)
  testMethodsRemoved: { className: string; methods: string[] }[]
  testMethodsAdded: { className: string; methods: string[] }[]
  testFilesRemoved: string[]
  testFilesAdded: string[]
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
    max_test_drop_percent: 5, // Allow up to 5% test count drop by default
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
  testSourceDir?: string,
  mainSourceDir?: string,
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

  // Scan source files for test methods
  const testMethods: { [className: string]: string[] } = {}
  if (testSourceDir) {
    const scannedMethods = scanTestSourceFiles(testSourceDir)
    for (const [className, methods] of scannedMethods) {
      testMethods[className] = methods.map((m) => m.methodName)
    }
  }

  // Scan production source files
  const productionClasses: QualityBaseline["metrics"]["productionClasses"] = {}
  if (mainSourceDir) {
    const scannedClasses = scanProductionSourceFiles(mainSourceDir)
    for (const [fullName, cls] of scannedClasses) {
      const methods: { [signature: string]: { lineNumber: number; filePath: string } } = {}
      for (const method of cls.methods) {
        methods[method.signature] = {
          lineNumber: method.lineNumber,
          filePath: method.filePath,
        }
      }
      productionClasses[fullName] = { methods }
    }
  }

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
      testMethods,
      slowTests: testResults.slowTests.slice(0, 10),
      productionClasses: Object.keys(productionClasses).length > 0 ? productionClasses : undefined,
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
      testMethodsRemoved: [],
      testMethodsAdded: [],
      testFilesRemoved: [],
      testFilesAdded: [],
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

  // Calculate adjusted coverage when tests are deleted AND coverage also dropped
  // If tests were deleted but coverage stayed stable, assume refactoring (don't penalize)
  let adjustedCoverage: QualityDiff["adjustedCoverage"] = undefined
  const coverageDropThreshold = -5 // Only penalize if coverage dropped by more than 5%

  if (testsDelta < 0 && previous.metrics.totalTests > 0) {
    const testRetentionRatio = current.metrics.totalTests / previous.metrics.totalTests
    const coverageAlsoDropped = coverageDelta.line < coverageDropThreshold

    if (coverageAlsoDropped) {
      // Tests deleted AND coverage dropped = real test deletion, apply penalty
      adjustedCoverage = {
        line: current.metrics.coverage.line.percent * testRetentionRatio,
        branch: current.metrics.coverage.branch.percent * testRetentionRatio,
        instruction: current.metrics.coverage.instruction.percent * testRetentionRatio,
        testRetentionRatio,
        penalty: `${(testRetentionRatio * 100).toFixed(1)}% of raw coverage`,
        reason: `${Math.abs(testsDelta)} tests deleted AND coverage dropped ${Math.abs(coverageDelta.line).toFixed(1)}%`,
      }

      // Add critical warning when adjusted coverage drops significantly
      if (adjustedCoverage.line < config.gates.min_line_coverage && current.metrics.coverage.line.percent >= config.gates.min_line_coverage) {
        warnings.push({
          level: "critical",
          code: "ADJUSTED_COVERAGE_BELOW_THRESHOLD",
          message: `Adjusted line coverage ${adjustedCoverage.line.toFixed(1)}% < ${config.gates.min_line_coverage}% threshold`,
          details: `Raw coverage ${current.metrics.coverage.line.percent.toFixed(1)}% penalized by test deletion ratio (${(testRetentionRatio * 100).toFixed(1)}%)`,
        })
      }
    } else {
      // Tests deleted but coverage stable = likely refactoring, just warn
      warnings.push({
        level: "info",
        code: "TESTS_REFACTORED",
        message: `${Math.abs(testsDelta)} tests removed but coverage stable - likely refactoring`,
        details: `Coverage changed only ${coverageDelta.line.toFixed(1)}%. If tests were intentionally removed, update baseline.`,
      })
    }
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
    adjustedCoverage,
    classChanges,
    newSlowTests,
    warnings,
    testMethodsRemoved: [],
    testMethodsAdded: [],
    testFilesRemoved: [],
    testFilesAdded: [],
  }
}

// ============================================================================
// Source File Comparison
// ============================================================================

export interface SourceDiffResult {
  testFilesRemoved: string[]
  testFilesAdded: string[]
  testMethodsRemoved: { className: string; methods: string[] }[]
  testMethodsAdded: { className: string; methods: string[] }[]
}

export interface ProductionSourceDiff {
  classesRemoved: string[]
  classesAdded: string[]
  methodsRemoved: { className: string; methodSignature: string }[]
  methodsAdded: { className: string; methodSignature: string }[]
  methodsAltered: { className: string; oldSignature: string; newSignature: string }[]
}

/**
 * Compare current source files vs previous baseline to detect deletions.
 * Works even without artifacts.
 */
export function computeSourceDiff(
  currentMethods: Map<string, TestMethod[]>,
  previousBaseline: QualityBaseline | null,
): SourceDiffResult {
  if (!previousBaseline) {
    // No previous baseline - everything is "added"
    const testFilesAdded: string[] = []
    const testMethodsAdded: { className: string; methods: string[] }[] = []

    for (const [className, methods] of currentMethods) {
      testFilesAdded.push(className)
      testMethodsAdded.push({
        className,
        methods: methods.map((m) => m.methodName),
      })
    }

    return {
      testFilesRemoved: [],
      testFilesAdded,
      testMethodsRemoved: [],
      testMethodsAdded,
    }
  }

  const testFilesRemoved: string[] = []
  const testFilesAdded: string[] = []
  const testMethodsRemoved: { className: string; methods: string[] }[] = []
  const testMethodsAdded: { className: string; methods: string[] }[] = []

  const prevMethods = previousBaseline.metrics.testMethods || {}
  const prevClasses = new Set(Object.keys(prevMethods))
  const currClasses = new Set(currentMethods.keys())

  // Find removed test classes (files)
  for (const className of prevClasses) {
    if (!currClasses.has(className)) {
      const methods = prevMethods[className] || []
      if (methods.length > 0) {
        testFilesRemoved.push(className)
        testMethodsRemoved.push({ className, methods })
      }
    }
  }

  // Find added test classes (files)
  for (const className of currClasses) {
    if (!prevClasses.has(className)) {
      const methods = currentMethods.get(className)?.map((m) => m.methodName) || []
      testFilesAdded.push(className)
      testMethodsAdded.push({ className, methods })
    }
  }

  // Find removed/added test methods within existing classes
  for (const className of prevClasses) {
    if (currClasses.has(className)) {
      const prevMethodSet = new Set(prevMethods[className] || [])
      const currMethodSet = new Set(currentMethods.get(className)?.map((m) => m.methodName) || [])

      const removed = Array.from(prevMethodSet).filter((m) => !currMethodSet.has(m))
      const added = Array.from(currMethodSet).filter((m) => !prevMethodSet.has(m))

      if (removed.length > 0) {
        testMethodsRemoved.push({ className, methods: removed })
      }
      if (added.length > 0) {
        testMethodsAdded.push({ className, methods: added })
      }
    }
  }

  return {
    testFilesRemoved,
    testFilesAdded,
    testMethodsRemoved,
    testMethodsAdded,
  }
}

/**
 * Compare current production source files vs previous baseline to detect deletions/alterations.
 * Works independently of build artifacts.
 */
export function computeProductionSourceDiff(
  currentClasses: Map<string, ProductionClass>,
  previousBaseline: QualityBaseline | null,
): ProductionSourceDiff {
  const result: ProductionSourceDiff = {
    classesRemoved: [],
    classesAdded: [],
    methodsRemoved: [],
    methodsAdded: [],
    methodsAltered: [],
  }

  if (!previousBaseline || !previousBaseline.metrics.productionClasses) {
    // No previous baseline with production classes - everything is "added"
    for (const [fullName, cls] of currentClasses) {
      result.classesAdded.push(fullName)
      for (const method of cls.methods) {
        result.methodsAdded.push({ className: fullName, methodSignature: method.signature })
      }
    }
    return result
  }

  const prevClasses = previousBaseline.metrics.productionClasses
  const prevClassSet = new Set(Object.keys(prevClasses))
  const currClassSet = new Set(currentClasses.keys())

  // Find removed classes
  for (const fullName of prevClassSet) {
    if (!currClassSet.has(fullName)) {
      result.classesRemoved.push(fullName)
      const prevMethods = prevClasses[fullName]?.methods || {}
      for (const signature of Object.keys(prevMethods)) {
        result.methodsRemoved.push({
          className: fullName,
          methodSignature: signature,
        })
      }
    }
  }

  // Find added classes
  for (const fullName of currClassSet) {
    if (!prevClassSet.has(fullName)) {
      result.classesAdded.push(fullName)
      const currMethods = currentClasses.get(fullName)?.methods || []
      for (const method of currMethods) {
        result.methodsAdded.push({ className: fullName, methodSignature: method.signature })
      }
    }
  }

  // Find method changes in existing classes
  for (const fullName of prevClassSet) {
    if (currClassSet.has(fullName)) {
      const prevMethods = prevClasses[fullName]?.methods || {}
      const currMethods = currentClasses.get(fullName)?.methods || []

      const prevSignatures = new Set(Object.keys(prevMethods))
      const currSignatures = new Set(currMethods.map((m) => m.signature))

      // Group by method name (before the /)
      const prevByName = new Map<string, string[]>()
      for (const sig of prevSignatures) {
        const name = sig.split("/")[0]
        if (!prevByName.has(name)) prevByName.set(name, [])
        prevByName.get(name)!.push(sig)
      }

      const currByName = new Map<string, string[]>()
      for (const sig of currSignatures) {
        const name = sig.split("/")[0]
        if (!currByName.has(name)) currByName.set(name, [])
        currByName.get(name)!.push(sig)
      }

      // Find removed methods
      for (const signature of prevSignatures) {
        if (!currSignatures.has(signature)) {
          const methodName = signature.split("/")[0]
          const currSigsWithName = currByName.get(methodName) || []

          // Check if this is an alteration (same name, different param count)
          if (currSigsWithName.length > 0 && !currSignatures.has(signature)) {
            // Method exists with different signature - it's altered
            const newSig = currSigsWithName[0]
            result.methodsAltered.push({
              className: fullName,
              oldSignature: signature,
              newSignature: newSig,
            })
          } else {
            // Method completely removed
            result.methodsRemoved.push({
              className: fullName,
              methodSignature: signature,
            })
          }
        }
      }

      // Find added methods (that aren't alterations)
      const alteredNewSigs = new Set(result.methodsAltered.map((a) => a.newSignature))
      for (const signature of currSignatures) {
        if (!prevSignatures.has(signature) && !alteredNewSigs.has(signature)) {
          result.methodsAdded.push({ className: fullName, methodSignature: signature })
        }
      }
    }
  }

  return result
}

// ============================================================================
// Gate Evaluation
// ============================================================================

export function evaluateGates(current: QualityBaseline, diff: QualityDiff, config: QualityConfig, previousTestCount?: number): GateResult {
  const failures: string[] = []

  // Use adjusted coverage if tests were deleted, otherwise use raw coverage
  const effectiveLineCoverage = diff.adjustedCoverage?.line ?? current.metrics.coverage.line.percent
  const effectiveBranchCoverage = diff.adjustedCoverage?.branch ?? current.metrics.coverage.branch.percent

  if (effectiveLineCoverage < config.gates.min_line_coverage) {
    if (diff.adjustedCoverage) {
      failures.push(
        `Adjusted line coverage ${effectiveLineCoverage.toFixed(1)}% < ${config.gates.min_line_coverage}% (raw: ${current.metrics.coverage.line.percent.toFixed(1)}%, penalized by test deletion)`
      )
    } else {
      failures.push(`Line coverage ${effectiveLineCoverage.toFixed(1)}% < ${config.gates.min_line_coverage}%`)
    }
  }

  if (effectiveBranchCoverage < config.gates.min_branch_coverage) {
    if (diff.adjustedCoverage) {
      failures.push(
        `Adjusted branch coverage ${effectiveBranchCoverage.toFixed(1)}% < ${config.gates.min_branch_coverage}% (raw: ${current.metrics.coverage.branch.percent.toFixed(1)}%, penalized by test deletion)`
      )
    } else {
      failures.push(`Branch coverage ${effectiveBranchCoverage.toFixed(1)}% < ${config.gates.min_branch_coverage}%`)
    }
  }

  // Test count drop check - passes if EITHER absolute OR percentage threshold is met
  if (diff.testsDelta < 0) {
    const absoluteDrop = Math.abs(diff.testsDelta)
    const absoluteThreshold = config.gates.max_test_drop

    // Calculate percentage drop if we have previous test count
    let percentageDrop = 0
    let percentageThreshold = config.gates.max_test_drop_percent ?? 0

    if (previousTestCount && previousTestCount > 0) {
      percentageDrop = (absoluteDrop / previousTestCount) * 100
    }

    // Gate fails only if BOTH thresholds are exceeded
    const exceedsAbsolute = absoluteDrop > absoluteThreshold
    const exceedsPercentage = percentageDrop > percentageThreshold

    if (exceedsAbsolute && exceedsPercentage) {
      failures.push(
        `Test count dropped by ${absoluteDrop} (${percentageDrop.toFixed(1)}%) - exceeds both absolute (${absoluteThreshold}) and percentage (${percentageThreshold}%) limits`
      )
    }
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
