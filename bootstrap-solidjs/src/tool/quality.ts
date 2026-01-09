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

    // Scan production source files
    const mainSourceDir = findMainSourceDir(projectPath)
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

    // Detect git-based changes (uncommitted deletions/modifications)
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

    // Create current baseline (includes testSourceDir and mainSourceDir for method scanning)
    const currentBaseline = await createBaseline(
      projectPath,
      testResults,
      coverageData,
      aggregateCov,
      testSourceDir || undefined,
      mainSourceDir || undefined,
    )

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
      productionDiff,
      gitChanges,
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
