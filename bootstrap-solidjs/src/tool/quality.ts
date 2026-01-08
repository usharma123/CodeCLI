/**
 * Quality Tool - Generate test quality reports from build artifacts
 *
 * Mimics SonarQube's approach: parse machine artifacts (JaCoCo CSV, Surefire XML)
 * directly rather than console output for robust, evidence-based metrics.
 */

import z from "zod"
import * as path from "path"
import { Tool } from "./tool"
import { Instance } from "../project/instance"
import DESCRIPTION from "./quality.txt"

import {
  parseJacocoCsv,
  parseSurefireDirectory,
  aggregateCoverage,
  detectIncidentalCoverage,
  findJacocoCsv,
  findSurefireDir,
  findTestSourceDir,
  scanTestSourceFiles,
  type ClassCoverage,
  type AggregateTestResults,
  type AggregateCoverage,
  type IncidentalCoverage,
  type TestMethod,
} from "./quality-parsers"

import {
  loadBaseline,
  saveBaseline,
  loadConfig,
  createBaseline,
  computeDiff,
  computeSourceDiff,
  evaluateGates,
  type QualityBaseline,
  type QualityDiff,
  type QualityWarning,
  type GateResult,
  type SourceDiffResult,
} from "./quality-baseline"

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

  // Summary Table
  lines.push("## Summary")
  lines.push("")
  lines.push("| Metric | Current | Gate |")
  lines.push("|--------|---------|------|")

  // Tests
  const testStatus = diff.testsDelta < 0 ? "WARN" : "PASS"
  lines.push(`| Tests | ${baseline.metrics.totalTests} | ${testStatus} |`)

  // Line Coverage
  const lineStatus = gateResult.failures.some((f) => f.includes("Line coverage")) ? "FAIL" : "PASS"
  lines.push(`| Line Coverage | ${formatPercent(baseline.metrics.coverage.line.percent)} | ${lineStatus} |`)

  // Branch Coverage
  const branchStatus = gateResult.failures.some((f) => f.includes("Branch coverage")) ? "FAIL" : "PASS"
  const branchNote = baseline.metrics.coverage.branch.percent === 0 ? " (< 60%)" : ""
  lines.push(`| Branch Coverage | ${formatPercent(baseline.metrics.coverage.branch.percent)}${branchNote} | ${branchStatus} |`)

  // Additional metrics
  lines.push(`| Instruction Coverage | ${formatPercent(baseline.metrics.coverage.instruction.percent)} | INFO |`)
  lines.push(`| Method Coverage | ${formatPercent(baseline.metrics.coverage.method.percent)} | INFO |`)
  lines.push("")

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

  // Gate Result
  lines.push("## Gate Result: " + (gateResult.passed ? "PASS" : "FAIL"))
  lines.push("")
  if (!gateResult.passed) {
    for (const failure of gateResult.failures) {
      lines.push(`- ${failure}`)
    }
    lines.push("")
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
// Quality Tool Definition
// ============================================================================

export const QualityTool = Tool.define("quality", {
  description: DESCRIPTION,
  parameters: z.object({
    project_path: z.string().describe("Path to Maven/Gradle project root (absolute or relative to cwd)"),
    update_baseline: z.boolean().optional().describe("Save current metrics as new baseline"),
    gate: z.boolean().optional().describe("Return non-zero exit if quality gates fail"),
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
      },
    })

    // Find artifacts
    const jacocoCsvPath = findJacocoCsv(projectPath)
    const surefireDir = findSurefireDir(projectPath)
    const testSourceDir = findTestSourceDir(projectPath)

    if (!jacocoCsvPath && !surefireDir) {
      return {
        title: "Quality Report",
        metadata: {
          tests: 0,
          lineCoverage: 0,
          branchCoverage: 0,
          gatesPassed: false,
          baselineUpdated: false,
        },
        output: `No test artifacts found in ${projectPath}

Expected locations:
  - target/site/jacoco/jacoco.csv (JaCoCo coverage)
  - target/surefire-reports/ (Surefire test results)

To generate artifacts, run:
  mvn clean test jacoco:report`,
      }
    }

    // Parse coverage data
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
            lineCoverage: 0,
            branchCoverage: 0,
            gatesPassed: false,
            baselineUpdated: false,
          },
          output: `Failed to parse JaCoCo CSV: ${err}`,
        }
      }
    }

    // Parse test results
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
            lineCoverage: 0,
            branchCoverage: 0,
            gatesPassed: false,
            baselineUpdated: false,
          },
          output: `Failed to parse Surefire reports: ${err}`,
        }
      }
    }

    // Detect incidental coverage
    let incidental: IncidentalCoverage[] = []
    if (testSourceDir && coverageData.length > 0) {
      incidental = detectIncidentalCoverage(coverageData, testSourceDir)
    }

    // Load config and previous baseline
    const config = loadConfig(projectPath)
    const previousBaseline = loadBaseline(projectPath)

    // Scan source files FIRST (works even without artifacts)
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
        const methodsInRemovedFiles = sourceDiff.testMethodsRemoved.filter(
          (item) => sourceDiff!.testFilesRemoved.includes(item.className),
        )
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

    // Create current baseline (includes testSourceDir for method scanning)
    const currentBaseline = await createBaseline(projectPath, testResults, coverageData, aggregateCov, testSourceDir || undefined)

    // Compute diff
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

    // Evaluate gates
    const gateResult = evaluateGates(currentBaseline, diff, config)

    // Generate report
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
    )

    // Update baseline if requested
    if (params.update_baseline) {
      saveBaseline(projectPath, currentBaseline)
    }

    // Throw error if gate check requested and failed
    if (params.gate && !gateResult.passed) {
      throw new Error(`Quality gates failed:\n${gateResult.failures.join("\n")}`)
    }

    return {
      title: `Quality: ${path.basename(projectPath)}`,
      metadata: {
        tests: testResults.total,
        lineCoverage: aggregateCov.line.percent,
        branchCoverage: aggregateCov.branch.percent,
        gatesPassed: gateResult.passed,
        baselineUpdated: params.update_baseline || false,
      },
      output: report,
    }
  },
})
