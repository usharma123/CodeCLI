import { spawn } from "child_process";
import {
  ToolDefinition,
  RunTestsInput,
  AnalyzeTestFailuresInput,
  GetCoverageInput,
  DetectChangedFilesInput,
} from "../types.js";
import { colors } from "../../utils/colors.js";
import { runShellCommand } from "../util-run.js";
import * as fs from "fs";
import * as path from "path";

/**
 * Parses Python coverage.xml (Cobertura format) and returns coverage metrics
 */
const parsePythonCoverageXml = (xmlPath: string): {
  lineRate: number;
  branchRate: number;
  linesValid: number;
  linesCovered: number;
  branchesValid: number;
  branchesCovered: number;
} | null => {
  try {
    const xmlData = fs.readFileSync(xmlPath, "utf-8");

    // Parse root coverage element attributes (Cobertura format)
    const lineRateMatch = xmlData.match(/<coverage[^>]*line-rate="([0-9.]+)"/);
    const branchRateMatch = xmlData.match(/<coverage[^>]*branch-rate="([0-9.]+)"/);
    const linesValidMatch = xmlData.match(/<coverage[^>]*lines-valid="(\d+)"/);
    const linesCoveredMatch = xmlData.match(/<coverage[^>]*lines-covered="(\d+)"/);
    const branchesValidMatch = xmlData.match(/<coverage[^>]*branches-valid="(\d+)"/);
    const branchesCoveredMatch = xmlData.match(/<coverage[^>]*branches-covered="(\d+)"/);

    if (lineRateMatch) {
      return {
        lineRate: parseFloat(lineRateMatch[1]),
        branchRate: branchRateMatch ? parseFloat(branchRateMatch[1]) : 0,
        linesValid: linesValidMatch ? parseInt(linesValidMatch[1]) : 0,
        linesCovered: linesCoveredMatch ? parseInt(linesCoveredMatch[1]) : 0,
        branchesValid: branchesValidMatch ? parseInt(branchesValidMatch[1]) : 0,
        branchesCovered: branchesCoveredMatch ? parseInt(branchesCoveredMatch[1]) : 0,
      };
    }
    return null;
  } catch (e) {
    return null;
  }
};

/**
 * Checks if required test dependencies are available
 */
const checkTestDependencies = async (language: string): Promise<{
  available: boolean;
  message: string;
}> => {
  if (language === "python") {
    const { exitCode } = await runShellCommand(
      "python3 -m pytest --version",
      process.cwd(),
      5000,
      process.env,
      false
    );

    if (exitCode !== 0) {
      return {
        available: false,
        message: "pytest is not installed. Install with:\n  pip install -r tests/python/requirements-test.txt\n\nOr run:\n  pip install pytest pytest-cov"
      };
    }
  } else if (language === "java") {
    const { exitCode } = await runShellCommand(
      "mvn --version",
      process.cwd(),
      5000,
      process.env,
      false
    );

    if (exitCode !== 0) {
      return {
        available: false,
        message: "Maven is not installed. Please install Maven:\n  brew install maven  # macOS\n  apt-get install maven  # Ubuntu"
      };
    }
  }

  return { available: true, message: "" };
};

const runTestsDefinition: ToolDefinition = {
  name: "run_tests",
  description:
    "Run tests for Python and/or Java projects with structured output parsing. Supports smoke, sanity, and full test modes. Returns test results with pass/fail counts and detailed failure information.",
  parameters: {
    type: "object",
    properties: {
      language: {
        type: "string",
        enum: ["python", "java", "all"],
        description:
          "Language to test: python, java, or all (default: all)",
      },
      mode: {
        type: "string",
        enum: ["smoke", "sanity", "full"],
        description:
          "Test mode: smoke (fast critical tests), sanity (targeted tests), full (all tests) (default: full)",
      },
      coverage: {
        type: "boolean",
        description: "Generate coverage reports (default: false)",
      },
      project_path: {
        type: "string",
        description: "Optional: specific project subdirectory for Java (e.g., 'spring-currencyconverter')",
      },
    },
  },
  function: async (input: RunTestsInput) => {
    try {
      const language = input.language || "all";
      const mode = input.mode || "full";
      const coverage = input.coverage || false;
      const projectPath = (input as RunTestsInput & { project_path?: string }).project_path;

      let command: string;
      let workingDir = process.cwd();
      let resultHeader = "";

      // For Java with specific project, run Maven directly in that directory
      if (language === "java" && projectPath) {
        const projectDir = path.join(process.cwd(), "tests/java", projectPath);
        if (fs.existsSync(projectDir) && fs.existsSync(path.join(projectDir, "pom.xml"))) {
          command = `mvn clean test ${coverage ? "jacoco:report" : ""} -q`;
          workingDir = projectDir;
          resultHeader = `Project: ${projectPath}\n`;
        } else {
          let result = `Test Execution Results\n`;
          result += `======================\n\n`;
          result += `Error: Project not found at tests/java/${projectPath}\n`;
          result += `Available Maven projects:\n`;
          const javaDir = path.join(process.cwd(), "tests/java");
          try {
            const subdirs = fs.readdirSync(javaDir, { withFileTypes: true })
              .filter(d => d.isDirectory() && fs.existsSync(path.join(javaDir, d.name, "pom.xml")))
              .map(d => d.name);
            subdirs.forEach(d => { result += `  - ${d}\n`; });
          } catch {
            // Ignore
          }
          return result;
        }
      } else {
        command = `bash scripts/test-runner.sh --mode ${mode} --language ${language}`;
        if (coverage) {
          command += " --coverage";
        }
      }

      const timeoutMs = 180000; // 3 minutes

      // Don't stream output - it corrupts the Ink UI
      const { stdout, stderr, exitCode, timedOut } = await runShellCommand(
        command,
        workingDir,
        timeoutMs,
        process.env,
        false  // Don't stream - prevents UI corruption
      );

      let result = `Test Execution Results\n`;
      result += `======================\n\n`;
      if (resultHeader) result += resultHeader;
      result += `Mode: ${mode}\n`;
      result += `Language: ${language}\n`;
      result += `Coverage: ${coverage ? "enabled" : "disabled"}\n`;

      if (timedOut) {
        result += `Status: TIMEOUT\n\n`;
        result += `The test process exceeded ${timeoutMs / 1000}s and was terminated.\n`;
        result += `If this was during dependency install (pip/mvn), rerun with network or preinstall deps:\n`;
        result += `  python: pip install -r tests/python/requirements-test.txt\n`;
        result += `  java: mvn -f tests/java/pom.xml test\n\n`;
        return result;
      }

      result += `Status: ${exitCode === 0 ? "PASSED" : "FAILED"}\n\n`;

      // Parse test counts from output
      const totalMatch = stdout.match(/Total Tests:\s+(\d+)/);
      const passedMatch = stdout.match(/Passed:\s+(\d+)/);
      const failedMatch = stdout.match(/Failed:\s+(\d+)/);

      if (totalMatch && passedMatch && failedMatch) {
        result += `--- SUMMARY ---\n`;
        result += `Total:  ${totalMatch[1]}\n`;
        result += `Passed: ${passedMatch[1]}\n`;
        result += `Failed: ${failedMatch[1]}\n\n`;
      }

      // For Java projects with project_path, parse surefire directly
      if (language === "java" && projectPath) {
        const surefireDir = path.join(workingDir, "target/surefire-reports");
        if (fs.existsSync(surefireDir)) {
          const counts = parseSurefireReports(surefireDir);
          if (counts.total > 0) {
            result += `--- TEST SUMMARY ---\n`;
            result += `Total:  ${counts.total}\n`;
            result += `Passed: ${counts.passed}\n`;
            result += `Failed: ${counts.failed}\n\n`;
          }
        }
      }

      // Parse Python test details
      if (
        (language === "python" || language === "all") &&
        fs.existsSync("tests/python/test-report.json")
      ) {
        try {
          const reportData = fs.readFileSync(
            "tests/python/test-report.json",
            "utf-8"
          );
          const report = JSON.parse(reportData);

          if (report.tests && report.tests.length > 0) {
            const failedTests = report.tests.filter((t: { outcome: string }) => t.outcome === "failed");
            if (failedTests.length > 0) {
              result += `--- PYTHON FAILURES ---\n`;
              failedTests.forEach((test: { nodeid: string; call?: { longrepr?: string } }) => {
                result += `\n❌ ${test.nodeid}\n`;
                if (test.call && test.call.longrepr) {
                  const errorPreview = test.call.longrepr.length > 200
                    ? test.call.longrepr.slice(0, 200) + "..."
                    : test.call.longrepr;
                  result += `   ${errorPreview}\n`;
                }
              });
            }
          }
        } catch {
          // Ignore JSON parsing errors
        }
      }

      // For Java, find and report surefire
      if (language === "java" || language === "all") {
        const javaBaseDir = projectPath 
          ? path.join(process.cwd(), "tests/java", projectPath)
          : path.join(process.cwd(), "tests/java");
        const surefireDir = findSurefireReports(javaBaseDir);
        
        if (surefireDir && fs.existsSync(surefireDir)) {
          const reports = fs.readdirSync(surefireDir)
            .filter((file: string) => file.endsWith(".xml") && file.startsWith("TEST-"));

          if (reports.length > 0) {
            result += `--- JAVA TEST REPORTS ---\n`;
            result += `Found ${reports.length} test report(s) in ${surefireDir}\n`;
          }
        }
      }

      // Only show errors if build failed
      if (stderr.trim() && exitCode !== 0 && !stderr.includes("BUILD SUCCESS")) {
        result += `\n--- ERRORS ---\n`;
        const stderrPreview = stderr.length > 500
          ? "...\n" + stderr.slice(-500)
          : stderr;
        result += stderrPreview;
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to run tests: ${error}`);
    }
  },
};

const analyzeTestFailuresDefinition: ToolDefinition = {
  name: "analyze_test_failures",
  description:
    "Analyze Python or Java test output to identify failures and suggest fixes. Provide the full test output.",
  parameters: {
    type: "object",
    properties: {
      test_output: {
        type: "string",
        description: "Full test output containing failures and stack traces",
      },
      language: {
        type: "string",
        enum: ["python", "java"],
        description: "Language of the tests",
      },
    },
    required: ["test_output", "language"],
  },
  function: async (input: AnalyzeTestFailuresInput) => {
    try {
      const { test_output, language } = input;

      const sections = test_output.split(/\n(?=FAIL|ERROR|FAILURES|FAILED|Error:|Exception:)/);
      const failureSections = sections.filter((s) => /FAIL|ERROR|FAILED/i.test(s));

      let result = `Test Failure Analysis (${language.toUpperCase()})\n`;
      result += `${"=".repeat(60)}\n\n`;

      if (failureSections.length === 0) {
        result += "No clear failures found in the provided output.\n";
        result += "Please include the full test output with stack traces.\n";
        return result;
      }

      failureSections.forEach((section, idx) => {
        result += `Failure ${idx + 1}:\n`;
        result += `${"-".repeat(40)}\n`;
        result += `${section.trim()}\n\n`;

        const fileMatch = section.match(/(tests?[\\/].*?\.(py|java))/i);
        if (fileMatch) {
          result += `File: ${fileMatch[1]}\n`;
        }

        const lineMatch = section.match(/:(\d+)(?=:|\s|$)/);
        if (lineMatch) {
          result += `Line: ${lineMatch[1]}\n`;
        }

        if (/AssertionError|assert/i.test(section)) {
          result += "Cause: Assertion failed - check expected vs actual values.\n";
        }
        if (/TypeError|NullPointerException/i.test(section)) {
          result += "Cause: Type or null reference error.\n";
        }
        if (/Timeout|timed out/i.test(section)) {
          result += "Cause: Test timed out - possible infinite loop or slow operation.\n";
        }
        if (/ImportError|ModuleNotFoundError|NoClassDefFoundError/i.test(section)) {
          result += "Cause: Missing dependency or wrong import path.\n";
        }

        result += `\nSuggested Fixes:\n`;
        result += `- Inspect the failing test and target implementation.\n`;
        result += `- Add logging/prints around the failure to capture state.\n`;
        result += `- For Python: run with -vv to see detailed test names.\n`;
        result += `- For Java: check surefire reports in tests/java/target/surefire-reports.\n\n`;
      });

      result += `Next Steps:\n`;
      result += `- Read the referenced files/lines to pinpoint the issue.\n`;
      result += `- Add targeted assertions to cover the failing cases.\n`;
      result += `- Rerun tests after applying fixes.\n`;

      return result;
    } catch (error) {
      throw new Error(`Failed to analyze test failures: ${error}`);
    }
  },
};

/**
 * Find JaCoCo XML report in tests/java directory (searches subdirectories)
 */
const findJacocoXml = (baseDir: string): string | null => {
  const possiblePaths = [
    // Direct path in tests/java
    path.join(baseDir, "target/site/jacoco/jacoco.xml"),
    // Common subprojects
    path.join(baseDir, "spring-currencyconverter/target/site/jacoco/jacoco.xml"),
    path.join(baseDir, "springboot/target/site/jacoco/jacoco.xml"),
    path.join(baseDir, "springboot-gradle/build/reports/jacoco/test/jacocoTestReport.xml"),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  // Search for any jacoco.xml in subdirectories
  try {
    const searchDirs = fs.readdirSync(baseDir, { withFileTypes: true })
      .filter(d => d.isDirectory() && !d.name.startsWith('.'))
      .map(d => d.name);
    
    for (const subdir of searchDirs) {
      const jacocoPath = path.join(baseDir, subdir, "target/site/jacoco/jacoco.xml");
      if (fs.existsSync(jacocoPath)) {
        return jacocoPath;
      }
    }
  } catch {
    // Ignore search errors
  }

  return null;
};

/**
 * Find surefire reports directory (searches subdirectories)
 */
const findSurefireReports = (baseDir: string): string | null => {
  const possiblePaths = [
    path.join(baseDir, "target/surefire-reports"),
    path.join(baseDir, "spring-currencyconverter/target/surefire-reports"),
    path.join(baseDir, "springboot/target/surefire-reports"),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  // Search subdirectories
  try {
    const searchDirs = fs.readdirSync(baseDir, { withFileTypes: true })
      .filter(d => d.isDirectory() && !d.name.startsWith('.'))
      .map(d => d.name);
    
    for (const subdir of searchDirs) {
      const surefirePath = path.join(baseDir, subdir, "target/surefire-reports");
      if (fs.existsSync(surefirePath)) {
        return surefirePath;
      }
    }
  } catch {
    // Ignore search errors
  }

  return null;
};

/**
 * Parse test counts from surefire XML reports
 */
const parseSurefireReports = (surefireDir: string): { total: number; passed: number; failed: number } => {
  let total = 0;
  let failed = 0;

  try {
    const reports = fs.readdirSync(surefireDir)
      .filter(f => f.startsWith("TEST-") && f.endsWith(".xml"));

    for (const report of reports) {
      const xmlData = fs.readFileSync(path.join(surefireDir, report), "utf-8");
      const testsMatch = xmlData.match(/tests="(\d+)"/);
      const failuresMatch = xmlData.match(/failures="(\d+)"/);
      const errorsMatch = xmlData.match(/errors="(\d+)"/);

      if (testsMatch) total += parseInt(testsMatch[1]);
      if (failuresMatch) failed += parseInt(failuresMatch[1]);
      if (errorsMatch) failed += parseInt(errorsMatch[1]);
    }
  } catch {
    // Ignore errors
  }

  return { total, passed: total - failed, failed };
};

const getCoverageDefinition: ToolDefinition = {
  name: "get_coverage",
  description:
    "Generate coverage report for Python or Java projects and summarize key metrics.",
  parameters: {
    type: "object",
    properties: {
      language: {
        type: "string",
        enum: ["python", "java"],
        description: "Language to generate coverage for",
      },
      project_path: {
        type: "string",
        description: "Optional: specific project subdirectory (e.g., 'spring-currencyconverter' for tests/java/spring-currencyconverter)",
      },
    },
    required: ["language"],
  },
  function: async (input: GetCoverageInput) => {
    try {
      const language = input.language;
      const projectPath = (input as { language: string; project_path?: string }).project_path;

      // Check dependencies first
      const depCheck = await checkTestDependencies(language);
      if (!depCheck.available) {
        let result = `Coverage Report (${language.toUpperCase()})\n`;
        result += `${"=".repeat(50)}\n\n`;
        result += `Status: DEPENDENCY MISSING\n\n`;
        result += depCheck.message;
        return result;
      }

      let result = `Coverage Report (${language.toUpperCase()})\n`;
      result += `${"=".repeat(50)}\n\n`;

      let command: string;
      let workingDir = process.cwd();
      
      if (language === "java" && projectPath) {
        // Run Maven directly in the specific project directory
        const projectDir = path.join(process.cwd(), "tests/java", projectPath);
        if (fs.existsSync(projectDir) && fs.existsSync(path.join(projectDir, "pom.xml"))) {
          command = "mvn clean test jacoco:report -q";
          workingDir = projectDir;
          result += `Project: ${projectPath}\n\n`;
        } else {
          result += `Warning: Project not found at tests/java/${projectPath}\n`;
          result += `Available projects:\n`;
          const javaDir = path.join(process.cwd(), "tests/java");
          try {
            const subdirs = fs.readdirSync(javaDir, { withFileTypes: true })
              .filter(d => d.isDirectory() && fs.existsSync(path.join(javaDir, d.name, "pom.xml")))
              .map(d => d.name);
            subdirs.forEach(d => { result += `  - ${d}\n`; });
          } catch {
            // Ignore
          }
          return result;
        }
      } else {
        command = `bash scripts/test-runner.sh --mode full --language ${language} --coverage`;
      }

      const timeoutMs = 300000; // 5 minutes

      // Don't stream output - it corrupts the Ink UI
      const { stdout, stderr, exitCode, timedOut } = await runShellCommand(
        command,
        workingDir,
        timeoutMs,
        process.env,
        false  // Don't stream - prevents UI corruption
      );

      if (timedOut) {
        result += `Status: TIMEOUT\n\n`;
        result += `Coverage generation exceeded ${timeoutMs / 1000}s.\n`;
        result += `This may indicate:\n`;
        result += `- Very large test suite\n`;
        result += `- Network issues downloading dependencies\n`;
        result += `- Hung test processes\n\n`;
        result += `Try running manually:\n  ${command}\n`;
        return result;
      }

      result += `Status: ${exitCode === 0 ? "PASSED" : "FAILED"}\n\n`;

      if (language === "python") {
        const xmlPath = path.join(process.cwd(), "tests/python/coverage.xml");
        const htmlPath = "tests/python/htmlcov/index.html";

        if (fs.existsSync(xmlPath)) {
          const coverage = parsePythonCoverageXml(xmlPath);

          if (coverage) {
            const linePercent = (coverage.lineRate * 100).toFixed(2);
            const branchPercent = (coverage.branchRate * 100).toFixed(2);

            result += `Line Coverage: ${linePercent}% (${coverage.linesCovered}/${coverage.linesValid})\n`;

            if (coverage.branchesValid > 0) {
              result += `Branch Coverage: ${branchPercent}% (${coverage.branchesCovered}/${coverage.branchesValid})\n`;
            }

            result += `\nCoverage Report: ${xmlPath}\n`;

            if (fs.existsSync(path.join(process.cwd(), htmlPath))) {
              result += `HTML Report: ${htmlPath}\n`;
            }
          } else {
            result += `Warning: Could not parse coverage.xml\n`;
            result += `XML file exists at: ${xmlPath}\n`;
          }
        } else {
          result += `Warning: coverage.xml not found at ${xmlPath}\n`;

          if (exitCode !== 0) {
            result += `\nTest execution failed. Common causes:\n`;
            result += `- pytest-cov not installed\n`;
            result += `- Tests failed before coverage could complete\n`;
            result += `- Invalid pytest configuration\n\n`;

            if (stderr.includes("No module named")) {
              result += `Missing Python module detected in errors.\n`;
            }
          }
        }

        result += `\nNext Steps:\n`;
        result += `1. Review uncovered lines in the HTML report\n`;
        result += `2. Write additional tests for uncovered code paths\n`;
        result += `3. Focus on edge cases and error handling\n`;
        result += `4. Aim for >80% line coverage and >70% branch coverage\n`;

      } else if (language === "java") {
        const javaBaseDir = projectPath 
          ? path.join(process.cwd(), "tests/java", projectPath)
          : path.join(process.cwd(), "tests/java");
        
        // Find JaCoCo report (searches subdirectories)
        const xmlPath = projectPath
          ? path.join(javaBaseDir, "target/site/jacoco/jacoco.xml")
          : findJacocoXml(javaBaseDir);

        // Find and parse surefire reports for test counts
        const surefireDir = projectPath
          ? path.join(javaBaseDir, "target/surefire-reports")
          : findSurefireReports(javaBaseDir);

        if (surefireDir && fs.existsSync(surefireDir)) {
          const testCounts = parseSurefireReports(surefireDir);
          result += `Tests Run: ${testCounts.total} (${testCounts.passed} passed, ${testCounts.failed} failed)\n\n`;
        }

        if (xmlPath && fs.existsSync(xmlPath)) {
          try {
            const xmlData = fs.readFileSync(xmlPath, "utf-8");

            // Parse JaCoCo XML format
            const instructionMatch = xmlData.match(
              /<counter type="INSTRUCTION" missed="(\d+)" covered="(\d+)"/
            );
            const branchMatch = xmlData.match(
              /<counter type="BRANCH" missed="(\d+)" covered="(\d+)"/
            );
            const lineMatch = xmlData.match(
              /<counter type="LINE" missed="(\d+)" covered="(\d+)"/
            );

            if (instructionMatch) {
              const missed = parseInt(instructionMatch[1]);
              const covered = parseInt(instructionMatch[2]);
              const total = missed + covered;
              const percent = ((covered / total) * 100).toFixed(2);
              result += `Instruction Coverage: ${percent}% (${covered}/${total})\n`;
            }

            if (lineMatch) {
              const missed = parseInt(lineMatch[1]);
              const covered = parseInt(lineMatch[2]);
              const total = missed + covered;
              const percent = ((covered / total) * 100).toFixed(2);
              result += `Line Coverage: ${percent}% (${covered}/${total})\n`;
            }

            if (branchMatch) {
              const missed = parseInt(branchMatch[1]);
              const covered = parseInt(branchMatch[2]);
              const total = missed + covered;
              const percent = ((covered / total) * 100).toFixed(2);
              result += `Branch Coverage: ${percent}% (${covered}/${total})\n`;
            }

            result += `\nCoverage Report: ${xmlPath}\n`;

            const htmlPath = path.join(path.dirname(xmlPath), "index.html");
            if (fs.existsSync(htmlPath)) {
              result += `HTML Report: ${htmlPath}\n`;
            }
          } catch (e) {
            result += `Could not parse coverage XML: ${e}\n`;
          }
        } else {
          const searchedPath = projectPath 
            ? `tests/java/${projectPath}/target/site/jacoco/jacoco.xml`
            : "tests/java/**/target/site/jacoco/jacoco.xml";
          result += `Warning: jacoco.xml not found at ${searchedPath}\n`;

          if (exitCode !== 0) {
            result += `\nTest execution failed. Common causes:\n`;
            result += `- Maven not configured properly\n`;
            result += `- JaCoCo plugin missing from pom.xml\n`;
            result += `- Tests failed before coverage could complete\n`;
          }

          // Suggest available projects
          if (!projectPath) {
            result += `\nTip: Specify a project with project_path parameter:\n`;
            const javaDir = path.join(process.cwd(), "tests/java");
            try {
              const subdirs = fs.readdirSync(javaDir, { withFileTypes: true })
                .filter(d => d.isDirectory() && fs.existsSync(path.join(javaDir, d.name, "pom.xml")))
                .map(d => d.name);
              subdirs.forEach(d => { result += `  - ${d}\n`; });
            } catch {
              // Ignore
            }
          }
        }

        result += `\nNext Steps:\n`;
        result += `1. Review uncovered lines in the JaCoCo HTML report\n`;
        result += `2. Write additional tests for uncovered code paths\n`;
        result += `3. Focus on edge cases and error handling\n`;
        result += `4. Check for untested exception handlers\n`;
      }

      // Only show errors if tests failed and there's meaningful error info
      if (stderr.trim() && exitCode !== 0 && !stderr.includes("BUILD SUCCESS")) {
        result += `\n--- ERRORS ---\n`;
        // Limit stderr to last 500 chars to avoid overwhelming output
        const stderrPreview = stderr.length > 500
          ? "...\n" + stderr.slice(-500)
          : stderr;
        result += stderrPreview;
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to get coverage: ${error}`);
    }
  },
};

const detectChangedFilesDefinition: ToolDefinition = {
  name: "detect_changed_files",
  description:
    "Detect files that have changed since a given commit or time period. Uses git to identify modified Python or Java files. Useful for running only affected tests.",
  parameters: {
    type: "object",
    properties: {
      since: {
        type: "string",
        description:
          "Git reference to compare against (e.g., 'HEAD~1', 'main', '1 day ago'). Default: HEAD",
      },
      language: {
        type: "string",
        enum: ["python", "java", "all"],
        description: "Filter by language (default: all)",
      },
    },
  },
  function: async (input: DetectChangedFilesInput) => {
    try {
      const since = input.since || "HEAD";
      const language = input.language || "all";

      console.log(
        `\n${colors.blue}Detecting changed files since ${since}...${colors.reset}\n`
      );

      const gitCommand = `git diff --name-only ${since}`;
      const proc = spawn("bash", ["-c", gitCommand]);

      let stdout = "";
      let stderr = "";

      proc.stdout.on("data", (data: Buffer) => {
        stdout += data.toString();
      });
      proc.stderr.on("data", (data: Buffer) => {
        stderr += data.toString();
      });

      await new Promise<void>((resolve, reject) => {
        proc.on("error", (error: Error) => {
          reject(new Error(`Failed to spawn git process: ${error.message}`));
        });
        proc.on("close", () => resolve());
      });

      if (stderr) {
        throw new Error(`Git error: ${stderr}`);
      }

      const allFiles = stdout
        .split("\n")
        .filter((f) => f.trim())
        .map((f) => f.trim());

      let filteredFiles = allFiles;
      if (language === "python") {
        filteredFiles = allFiles.filter((f) => f.endsWith(".py"));
      } else if (language === "java") {
        filteredFiles = allFiles.filter((f) => f.endsWith(".java"));
      } else {
        filteredFiles = allFiles.filter(
          (f) => f.endsWith(".py") || f.endsWith(".java")
        );
      }

      let result = `Changed Files Analysis\n`;
      result += `${"=".repeat(50)}\n\n`;
      result += `Since: ${since}\n`;
      result += `Language Filter: ${language}\n`;
      result += `Total Changed: ${allFiles.length} files\n`;
      result += `Filtered: ${filteredFiles.length} files\n\n`;

      if (filteredFiles.length === 0) {
        result += "No changed files matching the language filter.\n";
      } else {
        result += `Files:\n`;
        filteredFiles.forEach((file) => {
          result += `- ${file}\n`;
        });
      }

      result += `\nNext Steps:\n`;
      result += `1. Run targeted tests for these files\n`;
      result += `2. Focus fixes on changed files first\n`;
      result += `3. Generate regression tests if needed\n`;

      return result;
    } catch (error) {
      throw new Error(`Failed to detect changed files: ${error}`);
    }
  },
};

export const testTools = [
  runTestsDefinition,
  analyzeTestFailuresDefinition,
  getCoverageDefinition,
  detectChangedFilesDefinition,
];