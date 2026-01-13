/**
 * Quality Tool - Generate test quality reports from build artifacts
 *
 * Mimics SonarQube's approach: parse machine artifacts (JaCoCo CSV, Surefire XML)
 * directly rather than console output for robust, evidence-based metrics.
 *
 * Features automatic staleness detection via git status and file timestamps,
 * and auto-runs tests when stale artifacts are detected.
 */

import z from "zod"
import * as fs from "fs"
import * as path from "path"
import { Tool } from "./tool"
import { Instance } from "../project/instance"
import DESCRIPTION from "./quality.txt"
import { detectBuildTool } from "../testing/build-tool-detector"

import {
  parseJacocoCsv,
  parseSurefireDirectory,
  aggregateCoverage,
  detectIncidentalCoverage,
  findJacocoCsv,
  findSurefireDir,
  findTestSourceDir,
  findMainSourceDir,
  scanTestSourceFiles,
  scanProductionSourceFiles,
  type ClassCoverage,
  type AggregateTestResults,
  type AggregateCoverage,
  type IncidentalCoverage,
  type TestMethod,
  type ProductionClass,
} from "./quality-parsers"

import {
  loadBaseline,
  saveBaseline,
  loadConfig,
  createBaseline,
  computeDiff,
  computeSourceDiff,
  computeProductionSourceDiff,
  evaluateGates,
  type QualityBaseline,
  type QualityDiff,
  type QualityWarning,
  type GateResult,
  type SourceDiffResult,
  type ProductionSourceDiff,
} from "./quality-baseline"

import {
  checkFingerprintStaleness,
  computeFingerprint,
  saveFingerprint,
  loadFingerprint,
} from "./quality-fingerprint"

// ============================================================================
// Staleness Detection Types
// ============================================================================

export interface StalenessCheck {
  mustRunTests: boolean
  reasons: string[]
  gitChanges: {
    deletedTestFiles: string[]
    deletedTestMethods: { filePath: string; methods: string[] }[]
    modifiedTestFiles: string[]
    untrackedTestFiles: string[]
  }
  artifactInfo: {
    jacocoExists: boolean
    jacocoMtime: Date | null
    surefireExists: boolean
    surefireMtime: Date | null
  }
  sourceInfo: {
    newestTestFileMtime: Date | null
    newestTestFile: string | null
  }
  fingerprint?: {
    used: boolean
    reasons: string[]
  }
}

export interface TestExecutionResult {
  success: boolean
  exitCode: number
  duration: number // milliseconds
  summary: {
    testsRun: number
    failures: number
    errors: number
    skipped: number
  }
  output: string // full stdout/stderr for debugging
  command: string // what was executed
  timedOut: boolean
}

// ============================================================================
// Report Formatting
// ============================================================================

function formatPercent(value: number): string {
  return value.toFixed(1) + "%"
}

function formatDelta(value: number): string {
  if (value > 0) return `+${value.toFixed(1)}%`
  if (value < 0) return `${value.toFixed(1)}%`
  return "0.0%"
}

function padRight(str: string, len: number): string {
  return str.padEnd(len)
}

function padLeft(str: string, len: number): string {
  return str.padStart(len)
}

function generateReport(
  projectPath: string,
  baseline: QualityBaseline,
  previousBaseline: QualityBaseline | null,
  diff: QualityDiff,
  gateResult: GateResult,
  coverageData: ClassCoverage[],
  testResults: AggregateTestResults,
  incidental: IncidentalCoverage[],
  artifactPaths: { jacoco?: string; surefire?: string; testSrc?: string },
  productionDiff?: ProductionSourceDiff | null,
  gitChanges?: GitTestChanges | null,
  testExecution?: TestExecutionResult | null,
  staleness?: StalenessCheck | null,
): string {
  const lines: string[] = []

  // Project Header
  lines.push(`# ${path.basename(projectPath)} - Quality Report`)
  lines.push("")
  lines.push(`**Generated:** ${new Date().toISOString().replace("T", " ").substring(0, 19)}`)
  if (baseline.commit) {
    lines.push(`**Commit:** ${baseline.commit}`)
  }
  lines.push("")

  // Test Execution Section (if tests were run)
  if (testExecution) {
    lines.push("## Test Execution")
    lines.push("")
    lines.push("| Metric | Value |")
    lines.push("|--------|-------|")
    lines.push(`| Command | \`${testExecution.command}\` |`)
    lines.push(`| Duration | ${(testExecution.duration / 1000).toFixed(1)}s |`)
    lines.push(`| Status | ${testExecution.success ? "PASS" : testExecution.timedOut ? "TIMEOUT" : "FAIL"} |`)
    lines.push(`| Tests Run | ${testExecution.summary.testsRun} |`)
    lines.push(`| Passed | ${testExecution.summary.testsRun - testExecution.summary.failures - testExecution.summary.errors} |`)
    lines.push(`| Failed | ${testExecution.summary.failures} |`)
    lines.push(`| Errors | ${testExecution.summary.errors} |`)
    lines.push(`| Skipped | ${testExecution.summary.skipped} |`)
    lines.push("")

    // Staleness triggers
    if (staleness && staleness.reasons.length > 0) {
      lines.push("**Staleness triggers:**")
      for (const reason of staleness.reasons) {
        lines.push(`- ${reason}`)
      }
      lines.push("")
    }

    // Test output (collapsible)
    if (!testExecution.success || testExecution.summary.failures > 0 || testExecution.summary.errors > 0) {
      lines.push("<details>")
      lines.push("<summary>Test Output (click to expand)</summary>")
      lines.push("")
      lines.push("```")
      // Limit output to avoid massive reports
      const maxOutputLength = 10000
      if (testExecution.output.length > maxOutputLength) {
        lines.push(testExecution.output.substring(0, maxOutputLength))
        lines.push(`\n... (truncated, ${testExecution.output.length - maxOutputLength} more characters)`)
      } else {
        lines.push(testExecution.output)
      }
      lines.push("```")
      lines.push("")
      lines.push("</details>")
      lines.push("")
    }
  }

  // Summary Table
  lines.push("## Summary")
  lines.push("")

  // Check if we have adjusted coverage (tests were deleted)
  const hasAdjustedCoverage = diff.adjustedCoverage !== undefined

  if (hasAdjustedCoverage) {
    lines.push("| Metric | Raw (JaCoCo) | Adjusted | Gate |")
    lines.push("|--------|--------------|----------|------|")
  } else {
    lines.push("| Metric | Current | Gate |")
    lines.push("|--------|---------|------|")
  }

  // Tests
  const testStatus = diff.testsDelta < 0 ? "WARN" : "PASS"
  const testDeltaStr = diff.testsDelta !== 0 ? ` (${diff.testsDelta > 0 ? "+" : ""}${diff.testsDelta})` : ""
  if (hasAdjustedCoverage) {
    lines.push(`| Tests | ${baseline.metrics.totalTests}${testDeltaStr} | - | ${testStatus} |`)
  } else {
    lines.push(`| Tests | ${baseline.metrics.totalTests}${testDeltaStr} | ${testStatus} |`)
  }

  // Line Coverage
  const lineStatus = gateResult.failures.some((f) => f.includes("Line coverage") || f.includes("Adjusted")) ? "FAIL" : "PASS"
  if (hasAdjustedCoverage && diff.adjustedCoverage) {
    lines.push(`| Line Coverage | ${formatPercent(baseline.metrics.coverage.line.percent)} | **${formatPercent(diff.adjustedCoverage.line)}** | ${lineStatus} |`)
  } else {
    lines.push(`| Line Coverage | ${formatPercent(baseline.metrics.coverage.line.percent)} | ${lineStatus} |`)
  }

  // Branch Coverage
  const branchStatus = gateResult.failures.some((f) => f.includes("Branch coverage")) ? "FAIL" : "PASS"
  const branchNote = baseline.metrics.coverage.branch.percent === 0 ? " (< 60%)" : ""
  if (hasAdjustedCoverage && diff.adjustedCoverage) {
    lines.push(`| Branch Coverage | ${formatPercent(baseline.metrics.coverage.branch.percent)}${branchNote} | **${formatPercent(diff.adjustedCoverage.branch)}** | ${branchStatus} |`)
  } else {
    lines.push(`| Branch Coverage | ${formatPercent(baseline.metrics.coverage.branch.percent)}${branchNote} | ${branchStatus} |`)
  }

  // Additional metrics
  if (hasAdjustedCoverage && diff.adjustedCoverage) {
    lines.push(`| Instruction Coverage | ${formatPercent(baseline.metrics.coverage.instruction.percent)} | **${formatPercent(diff.adjustedCoverage.instruction)}** | INFO |`)
  } else {
    lines.push(`| Instruction Coverage | ${formatPercent(baseline.metrics.coverage.instruction.percent)} | INFO |`)
  }
  lines.push(`| Method Coverage | ${formatPercent(baseline.metrics.coverage.method.percent)} | INFO |`)
  lines.push("")

  // Adjusted coverage explanation
  if (hasAdjustedCoverage && diff.adjustedCoverage) {
    lines.push("### ⚠️ Coverage Adjusted")
    lines.push("")
    lines.push(`**${diff.adjustedCoverage.reason}**`)
    lines.push("")
    lines.push(`- Raw coverage (JaCoCo): ${formatPercent(baseline.metrics.coverage.line.percent)}`)
    lines.push(`- Test retention ratio: ${(diff.adjustedCoverage.testRetentionRatio * 100).toFixed(1)}%`)
    lines.push(`- Adjusted coverage: ${formatPercent(baseline.metrics.coverage.line.percent)} × ${(diff.adjustedCoverage.testRetentionRatio * 100).toFixed(1)}% = **${formatPercent(diff.adjustedCoverage.line)}**`)
    lines.push("")
    lines.push("> Coverage penalized because raw coverage doesn't reflect deleted tests.")
    lines.push("> If deleted tests were redundant, consider updating the baseline.")
    lines.push("")
  }

  // Per-Class Coverage
  lines.push("## Per-Class Coverage")
  lines.push("")
  lines.push("| Class | Line | Branch | Method |")
  lines.push("|-------|------|--------|--------|")

  // Sort by line coverage ascending (show lowest first)
  const sortedClasses = [...coverageData].sort((a, b) => a.line.percent - b.line.percent)

  for (const cls of sortedClasses) {
    const branchStr = cls.branch.missed + cls.branch.covered === 0 ? "N/A" : formatPercent(cls.branch.percent)
    lines.push(`| ${cls.className} | ${formatPercent(cls.line.percent)} | ${branchStr} | ${formatPercent(cls.method.percent)} |`)
  }
  lines.push("")

  // Incidental Coverage (Antipattern)
  if (incidental.length > 0) {
    lines.push("## Incidentally Covered (Antipattern)")
    lines.push("")
    lines.push("These classes show coverage but lack dedicated test files:")
    lines.push("")
    for (const inc of incidental) {
      const branchInfo = inc.coverage.branch.missed + inc.coverage.branch.covered > 0
        ? `, ${formatPercent(inc.coverage.branch.percent)} branch coverage`
        : ""
      lines.push(`- **${inc.className}** - ${formatPercent(inc.coverage.line.percent)} line coverage${branchInfo}`)
    }
    lines.push("")
  }

  // Slow Tests
  if (testResults.slowTests.length > 0 && testResults.slowTests[0].time > 0.05) {
    lines.push("## Slow Tests")
    lines.push("")
    for (const test of testResults.slowTests.slice(0, 5)) {
      if (test.time > 0.05) {
        const timeMs = (test.time * 1000).toFixed(0)
        const note = test.time > 0.3 ? " (Spring context load)" : ""
        lines.push(`- **${test.name}** - ${timeMs}ms${note}`)
      }
    }
    lines.push("")
  }

  // Warnings (if any critical or warning level)
  const significantWarnings = diff.warnings.filter(w => w.level === "critical" || w.level === "warning")
  if (significantWarnings.length > 0) {
    lines.push("## Warnings")
    lines.push("")
    for (const warning of significantWarnings) {
      const icon = warning.level === "critical" ? "**CRITICAL:**" : "**WARNING:**"
      lines.push(`- ${icon} ${warning.message}`)
      if (warning.details) {
        lines.push(`  - ${warning.details}`)
      }
    }
    lines.push("")
  }

  // Source File Changes (Detected)
  const hasSourceChanges =
    (diff.testFilesRemoved && diff.testFilesRemoved.length > 0) ||
    (diff.testMethodsRemoved && diff.testMethodsRemoved.length > 0)

  if (hasSourceChanges) {
    lines.push("## Source File Changes (Detected)")
    lines.push("")

    if (diff.testFilesRemoved && diff.testFilesRemoved.length > 0) {
      lines.push("**Test files deleted from source:**")
      for (const className of diff.testFilesRemoved) {
        lines.push(`- **${className}**`)
      }
      lines.push("")
    }

    // Show method deletions from files that still exist
    const methodsInExistingFiles = (diff.testMethodsRemoved || []).filter(
      (item) => !(diff.testFilesRemoved || []).includes(item.className),
    )

    if (methodsInExistingFiles.length > 0) {
      lines.push("**Test methods deleted from source files:**")
      for (const item of methodsInExistingFiles) {
        lines.push(`- **${item.className}**: ${item.methods.join(", ")}`)
      }
      lines.push("")
    }
  }

  // Production Code Changes (Detected)
  const hasProductionChanges =
    productionDiff &&
    (productionDiff.classesRemoved.length > 0 ||
      productionDiff.methodsRemoved.length > 0 ||
      productionDiff.methodsAltered.length > 0)

  if (hasProductionChanges && productionDiff) {
    lines.push("## Production Code Changes (Detected)")
    lines.push("")

    if (productionDiff.classesRemoved.length > 0) {
      lines.push("**Production classes deleted:**")
      for (const className of productionDiff.classesRemoved) {
        lines.push(`- **${className}**`)
      }
      lines.push("")
    }

    // Group removed methods by class (excluding methods from deleted classes)
    const removedClassSet = new Set(productionDiff.classesRemoved)
    const methodsFromExistingClasses = productionDiff.methodsRemoved.filter(
      (m) => !removedClassSet.has(m.className),
    )

    if (methodsFromExistingClasses.length > 0) {
      lines.push("**Production methods deleted:**")
      const byClass = new Map<string, string[]>()
      for (const m of methodsFromExistingClasses) {
        if (!byClass.has(m.className)) byClass.set(m.className, [])
        // Extract method name from signature (before the /)
        const methodName = m.methodSignature.split("/")[0]
        byClass.get(m.className)!.push(methodName)
      }
      for (const [className, methods] of byClass) {
        lines.push(`- **${className}**: ${methods.join(", ")}`)
      }
      lines.push("")
    }

    if (productionDiff.methodsAltered.length > 0) {
      lines.push("**Production methods altered (signature changed):**")
      for (const m of productionDiff.methodsAltered) {
        const oldName = m.oldSignature.split("/")[0]
        const oldParams = m.oldSignature.split("/")[1] || "0"
        const newParams = m.newSignature.split("/")[1] || "0"
        lines.push(`- **${m.className}.${oldName}**: ${oldParams} → ${newParams} params`)
      }
      lines.push("")
    }
  }

  // Uncommitted Changes (Git)
  const hasGitChanges =
    gitChanges &&
    (gitChanges.deletedTestFiles.length > 0 ||
      gitChanges.deletedTestMethods.length > 0 ||
      gitChanges.modifiedTestFiles.length > 0 ||
      gitChanges.untrackedTestFiles.length > 0)

  if (hasGitChanges && gitChanges) {
    lines.push("## Uncommitted Changes (Git)")
    lines.push("")

    if (gitChanges.deletedTestFiles.length > 0) {
      lines.push("**Test files deleted (uncommitted):**")
      for (const filePath of gitChanges.deletedTestFiles) {
        lines.push(`- \`${filePath}\``)
      }
      lines.push("")
    }

    if (gitChanges.deletedTestMethods.length > 0) {
      lines.push("**Test methods deleted (in modified files):**")
      for (const item of gitChanges.deletedTestMethods) {
        const fileName = path.basename(item.filePath, ".java")
        lines.push(`- **${fileName}**: ${item.methods.join(", ")}`)
      }
      lines.push("")
    }

    if (gitChanges.modifiedTestFiles.length > 0) {
      lines.push("**Modified test files:**")
      for (const filePath of gitChanges.modifiedTestFiles) {
        lines.push(`- \`${filePath}\``)
      }
      lines.push("")
    }

    if (gitChanges.untrackedTestFiles.length > 0) {
      lines.push("**Untracked test files:**")
      for (const filePath of gitChanges.untrackedTestFiles) {
        lines.push(`- \`${filePath}\``)
      }
      lines.push("")
    }
  }

  // Quality Gates (SonarQube-style detailed table)
  const config = {
    min_line_coverage: 70,
    min_branch_coverage: 60,
    max_test_drop: 0,
    max_slow_test_ms: 5000,
  }
  
  lines.push("## Quality Gates")
  lines.push("")
  lines.push("| Gate | Threshold | Actual | Status |")
  lines.push("|------|-----------|--------|--------|")
  
  const lineCovStatus = baseline.metrics.coverage.line.percent >= config.min_line_coverage ? "PASS" : "FAIL"
  lines.push(`| Line Coverage | >= ${config.min_line_coverage}% | ${formatPercent(baseline.metrics.coverage.line.percent)} | ${lineCovStatus} |`)
  
  const branchCovStatus = baseline.metrics.coverage.branch.percent >= config.min_branch_coverage ? "PASS" : "FAIL"
  lines.push(`| Branch Coverage | >= ${config.min_branch_coverage}% | ${formatPercent(baseline.metrics.coverage.branch.percent)} | ${branchCovStatus} |`)
  
  const testDropStatus = diff.testsDelta >= -config.max_test_drop ? "PASS" : "FAIL"
  lines.push(`| Test Count Drop | <= ${config.max_test_drop} | ${diff.testsDelta} | ${testDropStatus} |`)
  
  const maxSlowTime = testResults.slowTests.length > 0 ? testResults.slowTests[0].time * 1000 : 0
  const slowTestStatus = maxSlowTime <= config.max_slow_test_ms ? "PASS" : "FAIL"
  lines.push(`| Max Slow Test | <= ${config.max_slow_test_ms}ms | ${maxSlowTime.toFixed(0)}ms | ${slowTestStatus} |`)
  lines.push("")
  
  lines.push(`**Overall: ${gateResult.passed ? "PASS" : "FAIL"}**`)
  lines.push("")

  // Issues Section (SonarQube-style categorized issues)
  const criticalIssues = diff.warnings.filter(w => w.level === "critical")
  const warningIssues = diff.warnings.filter(w => w.level === "warning")
  const infoIssues = diff.warnings.filter(w => w.level === "info")
  
  if (criticalIssues.length > 0 || warningIssues.length > 0) {
    lines.push("## Issues")
    lines.push("")
    
    if (criticalIssues.length > 0) {
      lines.push(`### Critical (${criticalIssues.length})`)
      lines.push("")
      for (const issue of criticalIssues) {
        lines.push(`- **[${issue.code}]** ${issue.message}`)
        if (issue.details) {
          lines.push(`  - ${issue.details}`)
        }
      }
      lines.push("")
    }
    
    if (warningIssues.length > 0) {
      lines.push(`### Warnings (${warningIssues.length})`)
      lines.push("")
      for (const issue of warningIssues) {
        lines.push(`- **[${issue.code}]** ${issue.message}`)
        if (issue.details) {
          lines.push(`  - ${issue.details}`)
        }
      }
      lines.push("")
    }
    
    if (infoIssues.length > 0) {
      lines.push(`### Info (${infoIssues.length})`)
      lines.push("")
      for (const issue of infoIssues) {
        lines.push(`- **[${issue.code}]** ${issue.message}`)
        if (issue.details) {
          lines.push(`  - ${issue.details}`)
        }
      }
      lines.push("")
    }
  }

  // Actionable Recommendations
  const recommendations: string[] = []

  // Branch coverage recommendations
  if (baseline.metrics.coverage.branch.percent < 60) {
    const classesWithBranches = coverageData.filter(c => c.branch.missed + c.branch.covered > 0)
    if (classesWithBranches.length > 0) {
      const lowBranchClasses = classesWithBranches.filter(c => c.branch.percent < 50)
      if (lowBranchClasses.length > 0) {
        recommendations.push(`**Branch Coverage:** Add tests for conditional logic in: ${lowBranchClasses.map(c => c.className).join(", ")}`)
      }
    } else {
      recommendations.push("**Branch Coverage:** No conditional logic detected. Consider adding tests for edge cases.")
    }
  }

  // Incidental coverage recommendations
  if (incidental.length > 0) {
    recommendations.push(`**Incidental Coverage:** Create dedicated unit tests for: ${incidental.map(i => i.className).join(", ")}`)
  }

  // Low coverage class recommendations
  const lowCoverageClasses = coverageData.filter(c => c.line.percent < 70 && !c.className.endsWith("Test"))
  if (lowCoverageClasses.length > 0) {
    recommendations.push(`**Low Coverage:** Improve test coverage for: ${lowCoverageClasses.map(c => `${c.className} (${formatPercent(c.line.percent)})`).join(", ")}`)
  }

  if (recommendations.length > 0) {
    lines.push("## Recommendations")
    lines.push("")
    for (const rec of recommendations) {
      lines.push(`- ${rec}`)
    }
    lines.push("")
  }

  // Evidence (collapsed)
  lines.push("## Evidence")
  lines.push("")
  lines.push("Artifacts parsed:")
  if (artifactPaths.jacoco) {
    lines.push(`- \`${path.relative(projectPath, artifactPaths.jacoco)}\` (${coverageData.length} classes)`)
  }
  if (artifactPaths.surefire) {
    lines.push(`- \`${path.relative(projectPath, artifactPaths.surefire)}/\` (${testResults.suites.length} test suites)`)
  }

  return lines.join("\n")
}

// ============================================================================
// Staleness Detection
// ============================================================================

/**
 * Get the modification time of the newest file in a directory (recursive)
 */
async function getNewestFileMtime(
  dir: string,
  pattern: RegExp
): Promise<{ mtime: Date; filePath: string } | null> {
  let newest: { mtime: Date; filePath: string } | null = null

  const scanDir = async (currentDir: string): Promise<void> => {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name)
        if (entry.isDirectory() && !entry.name.startsWith(".")) {
          await scanDir(fullPath)
        } else if (entry.isFile() && pattern.test(entry.name)) {
          const stat = fs.statSync(fullPath)
          if (!newest || stat.mtime > newest.mtime) {
            newest = { mtime: stat.mtime, filePath: fullPath }
          }
        }
      }
    } catch {
      // Ignore errors (permission issues, etc.)
    }
  }

  await scanDir(dir)
  return newest
}

/**
 * Check if test artifacts are stale and tests need to be re-run.
 *
 * Uses a multi-layered approach:
 * 1. Fingerprint-based detection (primary) - content-addressable, handles CI edge cases
 * 2. Git status detection - catches uncommitted changes
 * 3. Timestamp-based detection (fallback) - used when no fingerprint exists
 */
async function checkTestStaleness(
  projectPath: string,
  jacocoCsvPath: string | null,
  surefireDir: string | null,
  testSourceDir: string | null,
  mainSourceDir: string | null = null
): Promise<StalenessCheck> {
  const result: StalenessCheck = {
    mustRunTests: false,
    reasons: [],
    gitChanges: {
      deletedTestFiles: [],
      deletedTestMethods: [],
      modifiedTestFiles: [],
      untrackedTestFiles: [],
    },
    artifactInfo: {
      jacocoExists: false,
      jacocoMtime: null,
      surefireExists: false,
      surefireMtime: null,
    },
    sourceInfo: {
      newestTestFileMtime: null,
      newestTestFile: null,
    },
  }

  // Check artifact existence first
  if (jacocoCsvPath && fs.existsSync(jacocoCsvPath)) {
    result.artifactInfo.jacocoExists = true
    result.artifactInfo.jacocoMtime = fs.statSync(jacocoCsvPath).mtime
  }

  if (surefireDir && fs.existsSync(surefireDir)) {
    result.artifactInfo.surefireExists = true
    const newestSurefire = await getNewestFileMtime(surefireDir, /\.xml$/)
    if (newestSurefire) {
      result.artifactInfo.surefireMtime = newestSurefire.mtime
    }
  }

  // If no artifacts exist, must run tests
  if (!result.artifactInfo.jacocoExists && !result.artifactInfo.surefireExists) {
    result.mustRunTests = true
    result.reasons.push("Artifacts: No JaCoCo or Surefire reports found")
    return result
  }

  // ========================================================================
  // Layer 1: Fingerprint-based staleness detection (primary)
  // ========================================================================

  const fingerprintResult = await checkFingerprintStaleness(projectPath, testSourceDir, mainSourceDir)

  if (fingerprintResult) {
    result.fingerprint = {
      used: true,
      reasons: fingerprintResult.reasons,
    }

    if (fingerprintResult.isStale) {
      result.mustRunTests = true
      // Prefix fingerprint reasons to distinguish from other detection methods
      for (const reason of fingerprintResult.reasons) {
        result.reasons.push(`Fingerprint: ${reason}`)
      }
    }
  } else {
    // No stored fingerprint - will rely on git + timestamp fallback
    result.fingerprint = {
      used: false,
      reasons: ["No stored fingerprint found - using fallback detection"],
    }
  }

  // ========================================================================
  // Layer 2: Git status detection (always run for detailed change info)
  // ========================================================================

  const gitChanges = await getGitChangedTestFiles(projectPath)

  if (gitChanges.deleted.length > 0) {
    result.mustRunTests = true
    result.gitChanges.deletedTestFiles = gitChanges.deleted
    result.reasons.push(`Git: ${gitChanges.deleted.length} test file(s) deleted (uncommitted)`)
  }

  if (gitChanges.modified.length > 0) {
    result.mustRunTests = true
    result.gitChanges.modifiedTestFiles = gitChanges.modified
    result.reasons.push(`Git: ${gitChanges.modified.length} test file(s) modified (uncommitted)`)

    // Check for deleted test methods in modified files
    for (const modifiedFile of gitChanges.modified) {
      const deletedMethods = await getDeletedTestMethods(projectPath, modifiedFile)
      if (deletedMethods.length > 0) {
        result.gitChanges.deletedTestMethods.push({
          filePath: modifiedFile,
          methods: deletedMethods,
        })
        result.reasons.push(
          `Git: ${path.basename(modifiedFile)}: ${deletedMethods.join(", ")} deleted`
        )
      }
    }
  }

  if (gitChanges.untracked.length > 0) {
    result.gitChanges.untrackedTestFiles = gitChanges.untracked
    result.mustRunTests = true
    result.reasons.push(`Git: ${gitChanges.untracked.length} new test file(s) not yet in coverage`)
  }

  // ========================================================================
  // Layer 3: Timestamp-based detection (fallback when no fingerprint)
  // ========================================================================

  // Only use timestamp fallback if fingerprint wasn't available
  if (!fingerprintResult && testSourceDir && fs.existsSync(testSourceDir)) {
    const newestSource = await getNewestFileMtime(testSourceDir, /Test\.java$|Tests\.java$/)
    if (newestSource) {
      result.sourceInfo.newestTestFileMtime = newestSource.mtime
      result.sourceInfo.newestTestFile = newestSource.filePath

      const artifactMtime = result.artifactInfo.jacocoMtime || result.artifactInfo.surefireMtime
      if (artifactMtime && newestSource.mtime > artifactMtime) {
        result.mustRunTests = true
        const ageDiff = Math.round((newestSource.mtime.getTime() - artifactMtime.getTime()) / 1000)
        result.reasons.push(
          `Artifacts: Test sources ${ageDiff}s newer than coverage reports (timestamp fallback)`
        )
      }
    }
  }

  return result
}

// ============================================================================
// Test Execution
// ============================================================================

const TEST_EXECUTION_TIMEOUT = 5 * 60 * 1000 // 5 minutes

/**
 * Execute tests with coverage generation.
 * Supports Maven and Gradle projects.
 */
async function executeTestsWithCoverage(
  projectPath: string,
  timeout: number = TEST_EXECUTION_TIMEOUT
): Promise<TestExecutionResult> {
  const buildConfig = await detectBuildTool(projectPath)

  let command: string[]
  let commandStr: string

  if (buildConfig.tool === "maven") {
    command = ["mvn", "clean", "test", "jacoco:report", "-B"]
    commandStr = "mvn clean test jacoco:report -B"
  } else if (buildConfig.tool === "gradle") {
    command = ["./gradlew", "clean", "test", "jacocoTestReport", "--console=plain"]
    commandStr = "./gradlew clean test jacocoTestReport --console=plain"
  } else {
    return {
      success: false,
      exitCode: -1,
      duration: 0,
      summary: { testsRun: 0, failures: 0, errors: 0, skipped: 0 },
      output: `Unsupported build tool. Expected Maven (pom.xml) or Gradle (build.gradle).`,
      command: "N/A",
      timedOut: false,
    }
  }

  const startTime = Date.now()
  let output = ""
  let timedOut = false

  try {
    const proc = Bun.spawn(command, {
      cwd: projectPath,
      stdout: "pipe",
      stderr: "pipe",
    })

    // Set up timeout
    const timeoutPromise = new Promise<"timeout">((resolve) => {
      setTimeout(() => resolve("timeout"), timeout)
    })

    const exitPromise = proc.exited

    // Race between completion and timeout
    const result = await Promise.race([exitPromise, timeoutPromise])

    if (result === "timeout") {
      proc.kill()
      timedOut = true
      output = "Test execution timed out after 5 minutes"
    } else {
      // Collect output
      const stdout = await new Response(proc.stdout).text()
      const stderr = await new Response(proc.stderr).text()
      output = stdout + (stderr ? "\n--- STDERR ---\n" + stderr : "")
    }

    const duration = Date.now() - startTime
    const exitCode = timedOut ? -1 : await proc.exited

    // Parse test summary from output
    const summary = parseTestSummary(output, buildConfig.tool)

    return {
      success: !timedOut && exitCode === 0,
      exitCode,
      duration,
      summary,
      output,
      command: commandStr,
      timedOut,
    }
  } catch (err) {
    return {
      success: false,
      exitCode: -1,
      duration: Date.now() - startTime,
      summary: { testsRun: 0, failures: 0, errors: 0, skipped: 0 },
      output: `Failed to execute tests: ${err}`,
      command: commandStr,
      timedOut: false,
    }
  }
}

/**
 * Parse test summary from Maven or Gradle output
 */
function parseTestSummary(
  output: string,
  tool: "maven" | "gradle" | "unknown"
): TestExecutionResult["summary"] {
  const summary = { testsRun: 0, failures: 0, errors: 0, skipped: 0 }

  if (tool === "maven") {
    // Maven format: "Tests run: X, Failures: Y, Errors: Z, Skipped: W"
    // Look for the final summary line (there may be multiple per-class lines)
    const lines = output.split("\n")
    for (let i = lines.length - 1; i >= 0; i--) {
      const match = lines[i].match(
        /Tests run:\s*(\d+),\s*Failures:\s*(\d+),\s*Errors:\s*(\d+),\s*Skipped:\s*(\d+)/
      )
      if (match) {
        summary.testsRun = parseInt(match[1], 10)
        summary.failures = parseInt(match[2], 10)
        summary.errors = parseInt(match[3], 10)
        summary.skipped = parseInt(match[4], 10)
        break
      }
    }
  } else if (tool === "gradle") {
    // Gradle format varies, look for "X tests completed, Y failed"
    const match = output.match(/(\d+)\s+tests?\s+completed,?\s*(\d+)?\s*failed?/i)
    if (match) {
      summary.testsRun = parseInt(match[1], 10)
      summary.failures = match[2] ? parseInt(match[2], 10) : 0
    }
  }

  return summary
}

// ============================================================================
// Git-Based Change Detection
// ============================================================================

export interface GitChangedFiles {
  modified: string[]
  deleted: string[]
  untracked: string[]
}

export interface GitTestChanges {
  deletedTestFiles: string[]
  deletedTestMethods: { filePath: string; methods: string[] }[]
  modifiedTestFiles: string[]
  untrackedTestFiles: string[]
}

async function getGitChangedTestFiles(projectPath: string): Promise<GitChangedFiles> {
  const result: GitChangedFiles = { modified: [], deleted: [], untracked: [] }

  try {
    // Get modified and deleted files using git status --porcelain
    const statusProc = Bun.spawn(["git", "status", "--porcelain"], { cwd: projectPath })
    const statusOutput = await new Response(statusProc.stdout).text()

    for (const line of statusOutput.trim().split("\n")) {
      if (!line) continue
      const status = line.substring(0, 2)
      const filePath = line.substring(3).trim()

      // Only care about test files (Java/Kotlin files in test directories or ending with Test)
      const isTestFile =
        filePath.includes("src/test/") ||
        filePath.endsWith("Test.java") ||
        filePath.endsWith("Test.kt") ||
        filePath.endsWith("Tests.java") ||
        filePath.endsWith("Tests.kt")

      if (!isTestFile) continue

      if (status.includes("M") || status.includes("A")) {
        result.modified.push(filePath)
      } else if (status.includes("D")) {
        result.deleted.push(filePath)
      } else if (status === "??") {
        result.untracked.push(filePath)
      }
    }
  } catch (err) {
    // Git not available or not a git repo - silently ignore
  }

  return result
}

async function getDeletedTestMethods(projectPath: string, filePath: string): Promise<string[]> {
  const deletedMethods: string[] = []

  try {
    // Get diff for the specific file
    const diffProc = Bun.spawn(["git", "diff", "--", filePath], { cwd: projectPath })
    const diffOutput = await new Response(diffProc.stdout).text()

    // Look for deleted test annotations followed by method definitions
    // Pattern matches lines starting with - that have @Test annotations or test method definitions
    const lines = diffOutput.split("\n")
    let inDeletedTestMethod = false
    let currentMethodName: string | null = null

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Check for deleted test annotation
      if (line.startsWith("-") && !line.startsWith("---")) {
        const content = line.substring(1).trim()

        // Check if this is a test annotation
        if (content.match(/^@(?:Test|ParameterizedTest|RepeatedTest)/)) {
          inDeletedTestMethod = true
          continue
        }

        // If we're in a deleted test method block, look for the method signature
        if (inDeletedTestMethod) {
          const methodMatch = content.match(/(?:public\s+|private\s+|protected\s+)?(?:void\s+)?(\w+)\s*\(/)
          if (methodMatch) {
            deletedMethods.push(methodMatch[1])
            inDeletedTestMethod = false
          }
        }

        // Also check for standalone test method deletion (annotation + method on same scan)
        if (content.match(/(?:public\s+|private\s+|protected\s+)?void\s+test\w*\s*\(/i)) {
          const methodMatch = content.match(/void\s+(\w+)\s*\(/)
          if (methodMatch && !deletedMethods.includes(methodMatch[1])) {
            deletedMethods.push(methodMatch[1])
          }
        }
      } else {
        // Reset if we hit a non-deleted line
        inDeletedTestMethod = false
      }
    }
  } catch (err) {
    // Git not available or file doesn't exist - silently ignore
  }

  return deletedMethods
}

async function detectGitTestChanges(projectPath: string): Promise<GitTestChanges> {
  const result: GitTestChanges = {
    deletedTestFiles: [],
    deletedTestMethods: [],
    modifiedTestFiles: [],
    untrackedTestFiles: [],
  }

  const gitChanges = await getGitChangedTestFiles(projectPath)

  result.deletedTestFiles = gitChanges.deleted
  result.modifiedTestFiles = gitChanges.modified
  result.untrackedTestFiles = gitChanges.untracked

  // For modified files, check what test methods were deleted
  for (const modifiedFile of gitChanges.modified) {
    const deletedMethods = await getDeletedTestMethods(projectPath, modifiedFile)
    if (deletedMethods.length > 0) {
      result.deletedTestMethods.push({
        filePath: modifiedFile,
        methods: deletedMethods,
      })
    }
  }

  return result
}

// ============================================================================
// Quality Tool Definition
// ============================================================================

export const QualityTool = Tool.define("quality", {
  description: DESCRIPTION,
  parameters: z.object({
    project_path: z.string().describe("Path to Maven/Gradle project root (absolute or relative to cwd)"),
    update_baseline: z.boolean().optional().describe("Save current metrics as new baseline (default: true after successful test run)"),
    gate: z.boolean().optional().describe("Return non-zero exit if quality gates fail"),
    run_tests: z.boolean().optional().describe("Force test execution before generating report (default: auto-detect based on git status and artifact age)"),
    skip_tests: z.boolean().optional().describe("Skip test execution even if staleness detected (use existing artifacts, may be outdated)"),
    json_output: z.string().optional().describe("Path to write JSON output (enables machine-readable output for CI integration)"),
  }),
  async execute(params, ctx) {
    const projectPath = path.isAbsolute(params.project_path)
      ? params.project_path
      : path.join(Instance.directory, params.project_path)

    await ctx.ask({
      permission: "read",
      patterns: [projectPath + "/**"],
      always: ["*"],
      metadata: {
        project_path: params.project_path,
        update_baseline: params.update_baseline,
        gate: params.gate,
        run_tests: params.run_tests,
        skip_tests: params.skip_tests,
      },
    })

    // ========================================================================
    // Phase 1: Staleness Detection
    // ========================================================================

    const testSourceDir = findTestSourceDir(projectPath)
    const mainSourceDir = findMainSourceDir(projectPath)
    let jacocoCsvPath = findJacocoCsv(projectPath)
    let surefireDir = findSurefireDir(projectPath)

    // Check staleness BEFORE parsing any artifacts
    const staleness = await checkTestStaleness(
      projectPath,
      jacocoCsvPath,
      surefireDir,
      testSourceDir,
      mainSourceDir
    )

    // Determine if we should run tests
    const shouldRunTests =
      params.run_tests === true ||
      (staleness.mustRunTests && params.skip_tests !== true)

    // ========================================================================
    // Phase 2: Test Execution (if needed)
    // ========================================================================

    let testExecution: TestExecutionResult | null = null

    if (shouldRunTests) {
      // Request write permission for test execution
      await ctx.ask({
        permission: "write",
        patterns: [projectPath + "/target/**"],
        always: ["*"],
        metadata: {
          action: "execute_tests",
          reasons: staleness.reasons,
        },
      })

      testExecution = await executeTestsWithCoverage(projectPath)

      // Refresh artifact paths after test execution
      jacocoCsvPath = findJacocoCsv(projectPath)
      surefireDir = findSurefireDir(projectPath)
    }

    // ========================================================================
    // Phase 3: Artifact Validation
    // ========================================================================

    if (!jacocoCsvPath && !surefireDir) {
      // No artifacts even after running tests
      let errorMessage = `No test artifacts found in ${projectPath}

Expected locations:
  - target/site/jacoco/jacoco.csv (JaCoCo coverage)
  - target/surefire-reports/ (Surefire test results)`

      if (testExecution) {
        errorMessage += `

Test execution ${testExecution.success ? "succeeded" : "failed"} but no artifacts were generated.

Possible causes:
  - JaCoCo plugin not configured in pom.xml
  - Tests failed to compile
  - No tests exist in project

<details>
<summary>Test Output</summary>

\`\`\`
${testExecution.output.substring(0, 5000)}${testExecution.output.length > 5000 ? "\n... (truncated)" : ""}
\`\`\`

</details>`
      } else {
        errorMessage += `

To generate artifacts, run:
  mvn clean test jacoco:report`
      }

      return {
        title: "Quality Report",
        metadata: {
          tests: 0,
          passed: 0,
          failed: 0,
          lineCoverage: 0,
          branchCoverage: 0,
          gatesPassed: false,
          baselineUpdated: false,
          testsExecuted: shouldRunTests,
          testDuration: testExecution?.duration,
          stalenessDetected: staleness.mustRunTests,
          stalenessReasons: staleness.reasons,
        },
        output: errorMessage,
      }
    }

    // ========================================================================
    // Phase 4: Parse Coverage Data
    // ========================================================================

    let coverageData: ClassCoverage[] = []
    let aggregateCov: AggregateCoverage = {
      instruction: { missed: 0, covered: 0, percent: 0 },
      branch: { missed: 0, covered: 0, percent: 0 },
      line: { missed: 0, covered: 0, percent: 0 },
      method: { missed: 0, covered: 0, percent: 0 },
      classCount: 0,
    }

    if (jacocoCsvPath) {
      try {
        coverageData = parseJacocoCsv(jacocoCsvPath)
        aggregateCov = aggregateCoverage(coverageData)
      } catch (err) {
        return {
          title: "Quality Report",
          metadata: {
            tests: 0,
            passed: 0,
            failed: 0,
            lineCoverage: 0,
            branchCoverage: 0,
            gatesPassed: false,
            baselineUpdated: false,
            testsExecuted: shouldRunTests,
            testDuration: testExecution?.duration,
            stalenessDetected: staleness.mustRunTests,
            stalenessReasons: staleness.reasons,
          },
          output: `Failed to parse JaCoCo CSV: ${err}`,
        }
      }
    }

    // ========================================================================
    // Phase 5: Parse Test Results
    // ========================================================================

    let testResults: AggregateTestResults = {
      total: 0,
      passed: 0,
      failed: 0,
      errors: 0,
      skipped: 0,
      totalTime: 0,
      suites: [],
      slowTests: [],
    }

    if (surefireDir) {
      try {
        testResults = parseSurefireDirectory(surefireDir)
      } catch (err) {
        return {
          title: "Quality Report",
          metadata: {
            tests: 0,
            passed: 0,
            failed: 0,
            lineCoverage: 0,
            branchCoverage: 0,
            gatesPassed: false,
            baselineUpdated: false,
            testsExecuted: shouldRunTests,
            testDuration: testExecution?.duration,
            stalenessDetected: staleness.mustRunTests,
            stalenessReasons: staleness.reasons,
          },
          output: `Failed to parse Surefire reports: ${err}`,
        }
      }
    }

    // ========================================================================
    // Phase 6: Detect Incidental Coverage
    // ========================================================================

    let incidental: IncidentalCoverage[] = []
    if (testSourceDir && coverageData.length > 0) {
      incidental = detectIncidentalCoverage(coverageData, testSourceDir)
    }

    // ========================================================================
    // Phase 7: Load Config and Baseline
    // ========================================================================

    const config = loadConfig(projectPath)
    const previousBaseline = loadBaseline(projectPath)

    // Re-calculate aggregate coverage with ignorePatterns if configured
    if (config.ignorePatterns && config.ignorePatterns.length > 0 && coverageData.length > 0) {
      aggregateCov = aggregateCoverage(coverageData, config.ignorePatterns)
    }

    // ========================================================================
    // Phase 8: Scan Source Files
    // ========================================================================

    let currentMethods: Map<string, TestMethod[]> = new Map()
    let sourceDiff: SourceDiffResult | null = null
    const sourceFileWarnings: QualityWarning[] = []

    if (testSourceDir) {
      currentMethods = scanTestSourceFiles(testSourceDir)

      if (previousBaseline) {
        sourceDiff = computeSourceDiff(currentMethods, previousBaseline)

        // Generate warnings for source file changes
        if (sourceDiff.testFilesRemoved.length > 0) {
          sourceFileWarnings.push({
            level: "critical",
            code: "TEST_FILES_DELETED",
            message: `${sourceDiff.testFilesRemoved.length} test file(s) deleted from source`,
            details: sourceDiff.testFilesRemoved.join(", "),
          })
        }

        // Count methods removed (excluding whole file deletions which are counted separately)
        const methodsInExistingFiles = sourceDiff.testMethodsRemoved.filter(
          (item) => !sourceDiff!.testFilesRemoved.includes(item.className),
        )

        if (methodsInExistingFiles.length > 0) {
          const totalMethodsRemoved = methodsInExistingFiles.reduce((sum, item) => sum + item.methods.length, 0)
          sourceFileWarnings.push({
            level: "critical",
            code: "TEST_METHODS_DELETED",
            message: `${totalMethodsRemoved} test method(s) deleted from source`,
            details: methodsInExistingFiles.map((item) => `${item.className}: ${item.methods.join(", ")}`).join("; "),
          })
        }
      }
    }

    // ========================================================================
    // Phase 9: Scan Production Source Files
    // ========================================================================

    // mainSourceDir already found in Phase 1 for fingerprint detection
    let currentProductionClasses: Map<string, ProductionClass> = new Map()
    let productionDiff: ProductionSourceDiff | null = null

    if (mainSourceDir) {
      currentProductionClasses = scanProductionSourceFiles(mainSourceDir)

      if (previousBaseline) {
        productionDiff = computeProductionSourceDiff(currentProductionClasses, previousBaseline)

        // Generate warnings for production code changes (warning level, not critical)
        if (productionDiff.classesRemoved.length > 0) {
          sourceFileWarnings.push({
            level: "warning",
            code: "PRODUCTION_CLASSES_DELETED",
            message: `${productionDiff.classesRemoved.length} production class(es) deleted`,
            details: productionDiff.classesRemoved.join(", "),
          })
        }

        // Count methods removed (excluding methods from deleted classes)
        const removedClassSet = new Set(productionDiff.classesRemoved)
        const methodsFromExistingClasses = productionDiff.methodsRemoved.filter(
          (m) => !removedClassSet.has(m.className),
        )

        if (methodsFromExistingClasses.length > 0) {
          sourceFileWarnings.push({
            level: "warning",
            code: "PRODUCTION_METHODS_DELETED",
            message: `${methodsFromExistingClasses.length} production method(s) deleted`,
            details: methodsFromExistingClasses
              .map((m) => `${m.className}.${m.methodSignature.split("/")[0]}`)
              .join(", "),
          })
        }

        if (productionDiff.methodsAltered.length > 0) {
          sourceFileWarnings.push({
            level: "info",
            code: "PRODUCTION_METHODS_ALTERED",
            message: `${productionDiff.methodsAltered.length} production method(s) signature changed`,
            details: productionDiff.methodsAltered
              .map((m) => `${m.className}.${m.oldSignature.split("/")[0]}`)
              .join(", "),
          })
        }
      }
    }

    // ========================================================================
    // Phase 10: Detect Git Changes (for reporting)
    // ========================================================================

    const gitChanges = await detectGitTestChanges(projectPath)

    // Generate warnings for git-detected changes
    if (gitChanges.deletedTestFiles.length > 0) {
      sourceFileWarnings.push({
        level: "critical",
        code: "TEST_FILES_DELETED_GIT",
        message: `${gitChanges.deletedTestFiles.length} test file(s) deleted (uncommitted)`,
        details: gitChanges.deletedTestFiles.join(", "),
      })
    }

    if (gitChanges.deletedTestMethods.length > 0) {
      const totalMethods = gitChanges.deletedTestMethods.reduce((sum, item) => sum + item.methods.length, 0)
      sourceFileWarnings.push({
        level: "critical",
        code: "TEST_METHODS_DELETED_GIT",
        message: `${totalMethods} test method(s) deleted (uncommitted)`,
        details: gitChanges.deletedTestMethods
          .map((item) => `${path.basename(item.filePath)}: ${item.methods.join(", ")}`)
          .join("; "),
      })
    }

    // ========================================================================
    // Phase 11: Create Baseline and Compute Diff
    // ========================================================================

    const currentBaseline = await createBaseline(
      projectPath,
      testResults,
      coverageData,
      aggregateCov,
      testSourceDir || undefined,
      mainSourceDir || undefined,
    )

    const diff = computeDiff(currentBaseline, previousBaseline, config)

    // Merge source file warnings into diff
    diff.warnings = [...sourceFileWarnings, ...diff.warnings]

    // Merge source diff results into diff
    if (sourceDiff) {
      diff.testMethodsRemoved = sourceDiff.testMethodsRemoved
      diff.testMethodsAdded = sourceDiff.testMethodsAdded
      diff.testFilesRemoved = sourceDiff.testFilesRemoved
      diff.testFilesAdded = sourceDiff.testFilesAdded
    }

    // ========================================================================
    // Phase 12: Evaluate Gates
    // ========================================================================

    const gateResult = evaluateGates(currentBaseline, diff, config, previousBaseline?.metrics.totalTests)

    // ========================================================================
    // Phase 13: Generate Report
    // ========================================================================

    const report = generateReport(
      projectPath,
      currentBaseline,
      previousBaseline,
      diff,
      gateResult,
      coverageData,
      testResults,
      incidental,
      {
        jacoco: jacocoCsvPath || undefined,
        surefire: surefireDir || undefined,
        testSrc: testSourceDir || undefined,
      },
      productionDiff,
      gitChanges,
      testExecution,
      staleness,
    )

    // ========================================================================
    // Phase 14: Auto-Update Baseline and Fingerprint
    // ========================================================================

    // Auto-update baseline after successful test run, or if explicitly requested
    const shouldUpdateBaseline =
      params.update_baseline === true ||
      (testExecution?.success === true && params.update_baseline !== false)

    if (shouldUpdateBaseline) {
      saveBaseline(projectPath, currentBaseline)

      // Save fingerprint for next run's staleness detection
      const fingerprint = await computeFingerprint(projectPath, testSourceDir, mainSourceDir)
      saveFingerprint(projectPath, fingerprint)
    }

    // ========================================================================
    // Phase 15: Gate Check
    // ========================================================================

    if (params.gate && !gateResult.passed) {
      throw new Error(`Quality gates failed:\n${gateResult.failures.join("\n")}`)
    }

    // ========================================================================
    // Phase 16: Write JSON Output (if requested)
    // ========================================================================

    const resultMetadata = {
      tests: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      lineCoverage: aggregateCov.line.percent,
      branchCoverage: aggregateCov.branch.percent,
      gatesPassed: gateResult.passed,
      baselineUpdated: shouldUpdateBaseline,
      testsExecuted: shouldRunTests,
      testDuration: testExecution?.duration,
      stalenessDetected: staleness.mustRunTests,
      stalenessReasons: staleness.reasons,
    }

    if (params.json_output) {
      const jsonOutput = {
        version: 1,
        timestamp: new Date().toISOString(),
        project: path.basename(projectPath),
        projectPath: projectPath,
        summary: resultMetadata,
        coverage: {
          aggregate: aggregateCov,
          perClass: coverageData.map((cls) => ({
            className: cls.className,
            fullName: cls.fullName,
            package: cls.package,
            line: cls.line.percent,
            branch: cls.branch.percent,
            instruction: cls.instruction.percent,
            method: cls.method.percent,
          })),
        },
        tests: {
          total: testResults.total,
          passed: testResults.passed,
          failed: testResults.failed,
          errors: testResults.errors,
          skipped: testResults.skipped,
          duration: testResults.totalTime,
          slowTests: testResults.slowTests,
        },
        gates: {
          passed: gateResult.passed,
          failures: gateResult.failures,
          config: config.gates,
        },
        diff: diff
          ? {
              testsDelta: diff.testsDelta,
              coverageDelta: diff.coverageDelta,
              testsRemoved: diff.testsRemoved,
              testsAdded: diff.testsAdded,
              warnings: diff.warnings,
            }
          : null,
        incidentalCoverage: incidental.map((i) => ({
          className: i.className,
          fullName: i.fullName,
          reason: i.reason,
        })),
      }

      const jsonPath = path.isAbsolute(params.json_output)
        ? params.json_output
        : path.join(projectPath, params.json_output)

      const jsonDir = path.dirname(jsonPath)
      if (!fs.existsSync(jsonDir)) {
        fs.mkdirSync(jsonDir, { recursive: true })
      }

      fs.writeFileSync(jsonPath, JSON.stringify(jsonOutput, null, 2), "utf-8")
    }

    return {
      title: `Quality: ${path.basename(projectPath)}`,
      metadata: resultMetadata,
      output: report,
    }
  },
})
