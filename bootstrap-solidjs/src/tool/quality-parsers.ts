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

export interface ProductionMethod {
  className: string
  methodName: string
  signature: string // e.g., "calculateTotal/2" (name/paramCount)
  filePath: string
  lineNumber: number
  paramCount: number
}

export interface ProductionClass {
  className: string
  fullName: string
  package: string
  filePath: string
  methods: ProductionMethod[]
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
 * Check if a class name matches any of the ignore patterns.
 * Supports glob-style patterns: ** matches any path, * matches any segment.
 */
export function matchesIgnorePattern(fullClassName: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    // Convert glob pattern to regex
    // ** matches any path (including /)
    // * matches any segment (excluding /)
    const regexStr = pattern
      .replace(/\./g, "\\.") // Escape dots
      .replace(/\*\*/g, "<<<DOUBLESTAR>>>") // Temporary placeholder
      .replace(/\*/g, "[^./]*") // Single * matches segment
      .replace(/<<<DOUBLESTAR>>>/g, ".*") // ** matches anything

    const regex = new RegExp(`^${regexStr}$|${regexStr}`)
    if (regex.test(fullClassName)) {
      return true
    }
  }
  return false
}

/**
 * Filter classes based on ignore patterns.
 * Returns classes that do NOT match any ignore pattern.
 */
export function filterClassesByPatterns(
  classes: ClassCoverage[],
  ignorePatterns: string[]
): { included: ClassCoverage[]; excluded: ClassCoverage[] } {
  if (!ignorePatterns || ignorePatterns.length === 0) {
    return { included: classes, excluded: [] }
  }

  const included: ClassCoverage[] = []
  const excluded: ClassCoverage[] = []

  for (const cls of classes) {
    if (matchesIgnorePattern(cls.fullName, ignorePatterns)) {
      excluded.push(cls)
    } else {
      included.push(cls)
    }
  }

  return { included, excluded }
}

/**
 * Calculate aggregate coverage from per-class data.
 * Optionally filter out classes matching ignore patterns.
 */
export function aggregateCoverage(
  classes: ClassCoverage[],
  ignorePatterns?: string[]
): AggregateCoverage {
  // Filter classes if patterns provided
  const filteredClasses = ignorePatterns
    ? filterClassesByPatterns(classes, ignorePatterns).included
    : classes

  const agg = {
    instruction: { missed: 0, covered: 0, percent: 0 },
    branch: { missed: 0, covered: 0, percent: 0 },
    line: { missed: 0, covered: 0, percent: 0 },
    method: { missed: 0, covered: 0, percent: 0 },
    classCount: filteredClasses.length,
  }

  for (const cls of filteredClasses) {
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
    // Extract all class names (including package-private, static, abstract, final)
    // This handles: public class, class (package-private), static class, abstract class, final class
    const classRegex = /(?:(?:public|protected|private)\s+)?(?:(?:static|final|abstract)\s+)*class\s+(\w+)/g
    const classesInFile: { name: string; position: number }[] = []
    let classMatch
    while ((classMatch = classRegex.exec(content)) !== null) {
      classesInFile.push({ name: classMatch[1], position: classMatch.index })
    }

    if (classesInFile.length === 0) continue

    const methods: TestMethod[] = []

    // Extract test methods (JUnit 4 @Test, JUnit 5 @Test, @ParameterizedTest, @RepeatedTest)
    // Match annotation followed by optional annotations/modifiers, then method signature
    const testMethodRegex = /@(?:Test|ParameterizedTest|RepeatedTest)\b[\s\S]*?(?:public\s+)?(?:void\s+)?(\w+)\s*\([^)]*\)\s*(?:throws\s+[\w,\s]+)?\s*\{/g
    let match

    while ((match = testMethodRegex.exec(content)) !== null) {
      const methodName = match[1]
      const methodPosition = match.index
      // Calculate line number by counting newlines before match
      const beforeMatch = content.substring(0, match.index)
      const lineNumber = beforeMatch.split("\n").length

      // Find the nearest enclosing class (the last class definition before this method)
      let className = classesInFile[0].name // Default to first class
      for (const cls of classesInFile) {
        if (cls.position < methodPosition) {
          className = cls.name
        } else {
          break
        }
      }

      methods.push({
        className,
        methodName,
        filePath,
        lineNumber,
      })
    }

    // Group methods by class name and add to results
    for (const method of methods) {
      const existing = testMethods.get(method.className) || []
      existing.push(method)
      testMethods.set(method.className, existing)
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

export function findMainSourceDir(projectRoot: string): string | null {
  const candidates = [
    path.join(projectRoot, "src/main/java"),
    path.join(projectRoot, "src/main/kotlin"),
    path.join(projectRoot, "src/main"),
  ]

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return p
    }
  }

  return null
}

// ============================================================================
// Production Source Scanning
// ============================================================================

/**
 * Extract package declaration from Java/Kotlin source
 */
function extractPackage(content: string): string {
  const packageMatch = content.match(/^package\s+([a-zA-Z0-9_.]+)\s*;?/m)
  return packageMatch ? packageMatch[1] : ""
}

/**
 * Extract class name from Java/Kotlin source
 * Handles: public, protected, private, package-private, static, final, abstract
 */
function extractClassName(content: string): string | null {
  // Match class (including all access modifiers and combinations)
  const classMatch = content.match(/(?:(?:public|protected|private)\s+)?(?:(?:static|final|abstract)\s+)*class\s+(\w+)/)
  if (classMatch) return classMatch[1]

  // Match interface (including all access modifiers)
  const interfaceMatch = content.match(/(?:(?:public|protected|private)\s+)?(?:(?:static|abstract)\s+)*interface\s+(\w+)/)
  if (interfaceMatch) return interfaceMatch[1]

  // Match enum (including all access modifiers)
  const enumMatch = content.match(/(?:(?:public|protected|private)\s+)?enum\s+(\w+)/)
  if (enumMatch) return enumMatch[1]

  return null
}

/**
 * Count parameters in a parameter string.
 * Handles generics by tracking angle bracket depth.
 */
function countParameters(paramsStr: string): number {
  if (!paramsStr || paramsStr.trim() === "") return 0

  let count = 1
  let depth = 0

  for (const char of paramsStr) {
    if (char === "<") depth++
    else if (char === ">") depth--
    else if (char === "," && depth === 0) count++
  }

  return count
}

/**
 * Extract method declarations from Java/Kotlin source.
 * Returns methods with name/paramCount signature format.
 */
function extractMethods(content: string, className: string): ProductionMethod[] {
  const methods: ProductionMethod[] = []

  // Match method signatures:
  // [modifiers] returnType methodName([params]) [throws] {
  // Handles: public, private, protected, static, final, abstract, synchronized, native
  const methodRegex = /(?:(?:public|private|protected|static|final|abstract|synchronized|native)\s+)*(?:[\w<>\[\],\s]+?)\s+(\w+)\s*\(([^)]*)\)\s*(?:throws\s+[\w\s,]+)?\s*\{/g

  let match
  while ((match = methodRegex.exec(content)) !== null) {
    const methodName = match[1]
    const paramsStr = match[2]?.trim() || ""

    // Skip constructors (same name as class)
    if (methodName === className) continue

    // Skip common false positives
    if (["if", "while", "for", "switch", "catch", "synchronized"].includes(methodName)) continue

    // Count parameters
    const paramCount = countParameters(paramsStr)

    // Build signature: methodName/paramCount
    const signature = `${methodName}/${paramCount}`

    // Calculate line number
    const beforeMatch = content.substring(0, match.index)
    const lineNumber = beforeMatch.split("\n").length

    methods.push({
      className,
      methodName,
      signature,
      paramCount,
      filePath: "", // Set by caller
      lineNumber,
    })
  }

  return methods
}

/**
 * Collect all Java/Kotlin source files in a directory recursively
 */
function collectSourceFiles(dir: string, files: Map<string, string>): void {
  if (!fs.existsSync(dir)) return

  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory() && entry.name !== "target" && entry.name !== "build" && !entry.name.startsWith(".")) {
      collectSourceFiles(fullPath, files)
    } else if (entry.isFile() && (entry.name.endsWith(".java") || entry.name.endsWith(".kt"))) {
      try {
        files.set(fullPath, fs.readFileSync(fullPath, "utf-8"))
      } catch {
        // Ignore unreadable files
      }
    }
  }
}

/**
 * Scan production source files and extract all classes and methods.
 * Works independently of build artifacts.
 */
export function scanProductionSourceFiles(mainSourceDir: string): Map<string, ProductionClass> {
  const classes = new Map<string, ProductionClass>()

  if (!fs.existsSync(mainSourceDir)) {
    return classes
  }

  const sourceFiles = new Map<string, string>()
  collectSourceFiles(mainSourceDir, sourceFiles)

  for (const [filePath, content] of sourceFiles) {
    const pkg = extractPackage(content)
    const className = extractClassName(content)

    if (!className) continue

    const fullName = pkg ? `${pkg}.${className}` : className
    const methods = extractMethods(content, className)

    // Set filePath for each method
    for (const method of methods) {
      method.filePath = filePath
    }

    classes.set(fullName, {
      className,
      fullName,
      package: pkg,
      filePath,
      methods,
    })
  }

  return classes
}
