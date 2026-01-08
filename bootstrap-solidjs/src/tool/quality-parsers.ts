/**
 * Quality Parsers - Parse JaCoCo CSV and Surefire XML artifacts
 *
 * Mimics SonarQube's approach: parse machine artifacts directly,
 * not console output, for robust and accurate metrics.
 */

import * as fs from "fs"
import * as path from "path"

// ============================================================================
// Types
// ============================================================================

export interface CoverageMetric {
  missed: number
  covered: number
  percent: number
}

export interface ClassCoverage {
  group: string
  package: string
  className: string
  fullName: string
  instruction: CoverageMetric
  branch: CoverageMetric
  line: CoverageMetric
  complexity: { missed: number; covered: number }
  method: CoverageMetric
}

export interface AggregateCoverage {
  instruction: CoverageMetric
  branch: CoverageMetric
  line: CoverageMetric
  method: CoverageMetric
  classCount: number
}

export interface TestCase {
  name: string
  className: string
  time: number
  status: "passed" | "failed" | "error" | "skipped"
  failure?: {
    message: string
    type: string
    stackTrace: string
  }
}

export interface TestSuiteResult {
  name: string
  tests: number
  errors: number
  failures: number
  skipped: number
  time: number
  testCases: TestCase[]
}

export interface AggregateTestResults {
  total: number
  passed: number
  failed: number
  errors: number
  skipped: number
  totalTime: number
  suites: TestSuiteResult[]
  slowTests: { name: string; className: string; time: number }[]
}

export interface IncidentalCoverage {
  className: string
  fullName: string
  coverage: ClassCoverage
  reason: string
}

export interface TestMethod {
  className: string
  methodName: string
  filePath: string
  lineNumber: number
}

// ============================================================================
// JaCoCo CSV Parser
// ============================================================================

function calculatePercent(missed: number, covered: number): number {
  const total = missed + covered
  if (total === 0) return 0
  return (covered / total) * 100
}

/**
 * Parse JaCoCo CSV report to extract per-class coverage metrics.
 *
 * CSV Format:
 * GROUP,PACKAGE,CLASS,INSTRUCTION_MISSED,INSTRUCTION_COVERED,BRANCH_MISSED,BRANCH_COVERED,
 * LINE_MISSED,LINE_COVERED,COMPLEXITY_MISSED,COMPLEXITY_COVERED,METHOD_MISSED,METHOD_COVERED
 */
export function parseJacocoCsv(csvPath: string): ClassCoverage[] {
  if (!fs.existsSync(csvPath)) {
    throw new Error(`JaCoCo CSV not found: ${csvPath}`)
  }

  const content = fs.readFileSync(csvPath, "utf-8")
  const lines = content.trim().split("\n")

  if (lines.length < 2) {
    return []
  }

  const results: ClassCoverage[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const fields = line.split(",")
    if (fields.length < 12) continue

    const [
      group,
      pkg,
      className,
      instrMissed,
      instrCovered,
      branchMissed,
      branchCovered,
      lineMissed,
      lineCovered,
      complexMissed,
      complexCovered,
      methodMissed,
      methodCovered,
    ] = fields

    const instrMissedNum = parseInt(instrMissed, 10)
    const instrCoveredNum = parseInt(instrCovered, 10)
    const branchMissedNum = parseInt(branchMissed, 10)
    const branchCoveredNum = parseInt(branchCovered, 10)
    const lineMissedNum = parseInt(lineMissed, 10)
    const lineCoveredNum = parseInt(lineCovered, 10)
    const complexMissedNum = parseInt(complexMissed, 10)
    const complexCoveredNum = parseInt(complexCovered, 10)
    const methodMissedNum = parseInt(methodMissed, 10)
    const methodCoveredNum = parseInt(methodCovered, 10)

    results.push({
      group,
      package: pkg,
      className,
      fullName: `${pkg}.${className}`,
      instruction: {
        missed: instrMissedNum,
        covered: instrCoveredNum,
        percent: calculatePercent(instrMissedNum, instrCoveredNum),
      },
      branch: {
        missed: branchMissedNum,
        covered: branchCoveredNum,
        percent: calculatePercent(branchMissedNum, branchCoveredNum),
      },
      line: {
        missed: lineMissedNum,
        covered: lineCoveredNum,
        percent: calculatePercent(lineMissedNum, lineCoveredNum),
      },
      complexity: {
        missed: complexMissedNum,
        covered: complexCoveredNum,
      },
      method: {
        missed: methodMissedNum,
        covered: methodCoveredNum,
        percent: calculatePercent(methodMissedNum, methodCoveredNum),
      },
    })
  }

  return results
}

/**
 * Calculate aggregate coverage from per-class data.
 */
export function aggregateCoverage(classes: ClassCoverage[]): AggregateCoverage {
  const agg = {
    instruction: { missed: 0, covered: 0, percent: 0 },
    branch: { missed: 0, covered: 0, percent: 0 },
    line: { missed: 0, covered: 0, percent: 0 },
    method: { missed: 0, covered: 0, percent: 0 },
    classCount: classes.length,
  }

  for (const cls of classes) {
    agg.instruction.missed += cls.instruction.missed
    agg.instruction.covered += cls.instruction.covered
    agg.branch.missed += cls.branch.missed
    agg.branch.covered += cls.branch.covered
    agg.line.missed += cls.line.missed
    agg.line.covered += cls.line.covered
    agg.method.missed += cls.method.missed
    agg.method.covered += cls.method.covered
  }

  agg.instruction.percent = calculatePercent(agg.instruction.missed, agg.instruction.covered)
  agg.branch.percent = calculatePercent(agg.branch.missed, agg.branch.covered)
  agg.line.percent = calculatePercent(agg.line.missed, agg.line.covered)
  agg.method.percent = calculatePercent(agg.method.missed, agg.method.covered)

  return agg
}

// ============================================================================
// Surefire XML Parser
// ============================================================================

/**
 * Parse a single Surefire XML report file.
 */
export function parseSurefireXml(xmlPath: string): TestSuiteResult {
  if (!fs.existsSync(xmlPath)) {
    throw new Error(`Surefire XML not found: ${xmlPath}`)
  }

  const content = fs.readFileSync(xmlPath, "utf-8")

  // Parse testsuite attributes
  const nameMatch = content.match(/<testsuite[^>]*\sname="([^"]*)"/)
  const timeMatch = content.match(/<testsuite[^>]*\stime="([^"]*)"/)
  const testsMatch = content.match(/<testsuite[^>]*\stests="(\d+)"/)
  const errorsMatch = content.match(/<testsuite[^>]*\serrors="(\d+)"/)
  const skippedMatch = content.match(/<testsuite[^>]*\sskipped="(\d+)"/)
  const failuresMatch = content.match(/<testsuite[^>]*\sfailures="(\d+)"/)

  if (!nameMatch || !testsMatch) {
    throw new Error(`Could not parse testsuite from ${xmlPath}`)
  }

  const result: TestSuiteResult = {
    name: nameMatch[1],
    time: timeMatch ? parseFloat(timeMatch[1]) : 0,
    tests: parseInt(testsMatch[1], 10),
    errors: errorsMatch ? parseInt(errorsMatch[1], 10) : 0,
    skipped: skippedMatch ? parseInt(skippedMatch[1], 10) : 0,
    failures: failuresMatch ? parseInt(failuresMatch[1], 10) : 0,
    testCases: [],
  }

  result.testCases = parseTestCases(content)
  return result
}

function parseTestCases(xmlContent: string): TestCase[] {
  const testCases: TestCase[] = []

  const testCaseRegex =
    /<testcase\s+name="([^"]*)"[^>]*\sclassname="([^"]*)"[^>]*\stime="([^"]*)"[^>]*(?:\/>|>([\s\S]*?)<\/testcase>)/g

  let match
  while ((match = testCaseRegex.exec(xmlContent)) !== null) {
    const [, name, className, time, innerContent] = match

    const testCase: TestCase = {
      name,
      className,
      time: parseFloat(time),
      status: "passed",
    }

    if (innerContent) {
      const failureMatch = innerContent.match(
        /<failure[^>]*(?:\smessage="([^"]*)")?[^>]*(?:\stype="([^"]*)")?[^>]*>([\s\S]*?)<\/failure>/,
      )
      if (failureMatch) {
        testCase.status = "failed"
        testCase.failure = {
          message: failureMatch[1] || "",
          type: failureMatch[2] || "",
          stackTrace: failureMatch[3]?.trim() || "",
        }
      }

      const errorMatch = innerContent.match(
        /<error[^>]*(?:\smessage="([^"]*)")?[^>]*(?:\stype="([^"]*)")?[^>]*>([\s\S]*?)<\/error>/,
      )
      if (errorMatch) {
        testCase.status = "error"
        testCase.failure = {
          message: errorMatch[1] || "",
          type: errorMatch[2] || "",
          stackTrace: errorMatch[3]?.trim() || "",
        }
      }

      if (/<skipped/.test(innerContent)) {
        testCase.status = "skipped"
      }
    }

    testCases.push(testCase)
  }

  return testCases
}

/**
 * Parse all Surefire reports in a directory.
 */
export function parseSurefireDirectory(dir: string): AggregateTestResults {
  if (!fs.existsSync(dir)) {
    throw new Error(`Surefire reports directory not found: ${dir}`)
  }

  const files = fs.readdirSync(dir).filter((f) => f.startsWith("TEST-") && f.endsWith(".xml"))

  const suites: TestSuiteResult[] = []
  const allTests: { name: string; className: string; time: number }[] = []

  for (const file of files) {
    try {
      const suite = parseSurefireXml(path.join(dir, file))

      // Skip empty parent suites (JUnit 5 creates these)
      if (suite.tests === 0 && suite.testCases.length === 0) {
        continue
      }

      suites.push(suite)

      for (const tc of suite.testCases) {
        allTests.push({
          name: tc.name,
          className: tc.className,
          time: tc.time,
        })
      }
    } catch {
      // Skip malformed files
    }
  }

  let total = 0
  let failed = 0
  let errors = 0
  let skipped = 0
  let totalTime = 0

  for (const suite of suites) {
    total += suite.tests
    failed += suite.failures
    errors += suite.errors
    skipped += suite.skipped
    totalTime += suite.time
  }

  const slowTests = allTests.sort((a, b) => b.time - a.time).slice(0, 10)

  return {
    total,
    passed: total - failed - errors - skipped,
    failed,
    errors,
    skipped,
    totalTime,
    suites,
    slowTests,
  }
}

// ============================================================================
// Incidental Coverage Detection
// ============================================================================

/**
 * Detect classes covered but not directly referenced by any test file.
 */
export function detectIncidentalCoverage(coverage: ClassCoverage[], testSourceDir: string): IncidentalCoverage[] {
  if (!fs.existsSync(testSourceDir)) {
    return []
  }

  const testFileContents: Map<string, string> = new Map()
  collectTestFiles(testSourceDir, testFileContents)

  const referencedClasses = new Set<string>()

  for (const [, content] of testFileContents) {
    // Extract imports
    const importRegex = /import\s+(?:static\s+)?([a-zA-Z_][a-zA-Z0-9_.]*)/g
    let match
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1]
      const className = importPath.split(".").pop()
      if (className) {
        referencedClasses.add(className)
      }
    }

    // Extract class references in code
    const classRefRegex =
      /\bnew\s+([A-Z][a-zA-Z0-9_]*)|([A-Z][a-zA-Z0-9_]*)\.(?:[a-z]|[A-Z])|@\w+\s+([A-Z][a-zA-Z0-9_]*)/g
    while ((match = classRefRegex.exec(content)) !== null) {
      const className = match[1] || match[2] || match[3]
      if (className) {
        referencedClasses.add(className)
      }
    }
  }

  const incidental: IncidentalCoverage[] = []

  for (const cls of coverage) {
    if (cls.line.covered === 0 && cls.instruction.covered === 0) {
      continue
    }

    if (cls.className.endsWith("Test") || cls.className.endsWith("Tests")) {
      continue
    }

    if (!referencedClasses.has(cls.className)) {
      incidental.push({
        className: cls.className,
        fullName: cls.fullName,
        coverage: cls,
        reason: "No test file directly references this class",
      })
    }
  }

  return incidental
}

function collectTestFiles(dir: string, files: Map<string, string>): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory() && entry.name !== "target" && !entry.name.startsWith(".")) {
      collectTestFiles(fullPath, files)
    } else if (entry.isFile() && entry.name.endsWith(".java")) {
      try {
        files.set(fullPath, fs.readFileSync(fullPath, "utf-8"))
      } catch {
        // Ignore
      }
    }
  }
}

/**
 * Scan test source files and extract test methods.
 * Works even when artifacts don't exist yet.
 */
export function scanTestSourceFiles(testSourceDir: string): Map<string, TestMethod[]> {
  const testMethods = new Map<string, TestMethod[]>()

  if (!fs.existsSync(testSourceDir)) {
    return testMethods
  }

  const testFiles = new Map<string, string>()
  collectTestFiles(testSourceDir, testFiles)

  for (const [filePath, content] of testFiles) {
    // Extract class name
    const classMatch = content.match(/public\s+(?:final\s+)?class\s+(\w+)/)
    if (!classMatch) continue

    const className = classMatch[1]
    const methods: TestMethod[] = []

    // Extract test methods (JUnit 4 @Test, JUnit 5 @Test, @ParameterizedTest, @RepeatedTest)
    // Match annotation followed by optional annotations/modifiers, then method signature
    const testMethodRegex = /@(?:Test|ParameterizedTest|RepeatedTest)\b[\s\S]*?(?:public\s+)?(?:void\s+)?(\w+)\s*\([^)]*\)\s*(?:throws\s+[\w,\s]+)?\s*\{/g
    let match

    while ((match = testMethodRegex.exec(content)) !== null) {
      const methodName = match[1]
      // Calculate line number by counting newlines before match
      const beforeMatch = content.substring(0, match.index)
      const lineNumber = beforeMatch.split("\n").length

      methods.push({
        className,
        methodName,
        filePath,
        lineNumber,
      })
    }

    if (methods.length > 0) {
      testMethods.set(className, methods)
    }
  }

  return testMethods
}

// ============================================================================
// Artifact Discovery
// ============================================================================

export function findJacocoCsv(projectRoot: string): string | null {
  const candidates = [
    path.join(projectRoot, "target/site/jacoco/jacoco.csv"),
    path.join(projectRoot, "build/reports/jacoco/test/jacocoTestReport.csv"),
  ]

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return p
    }
  }

  return null
}

export function findSurefireDir(projectRoot: string): string | null {
  const candidates = [path.join(projectRoot, "target/surefire-reports"), path.join(projectRoot, "build/test-results/test")]

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return p
    }
  }

  return null
}

export function findTestSourceDir(projectRoot: string): string | null {
  const candidates = [
    path.join(projectRoot, "src/test/java"),
    path.join(projectRoot, "src/test/kotlin"),
    path.join(projectRoot, "src/test"),
  ]

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return p
    }
  }

  return null
}
