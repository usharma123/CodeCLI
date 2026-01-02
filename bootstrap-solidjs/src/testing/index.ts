/**
 * Testing Module
 *
 * Provides utilities for Java and Python test detection and execution.
 */

export * from "./build-tool-detector"
export * from "./springboot-detector"

/**
 * Test Discovery namespace for finding and running tests
 */
export namespace TestDiscovery {
  /**
   * Finds test files in a Java project
   * @param projectPath - Path to the project
   * @param testSourceDir - Test source directory (e.g., "src/test/java")
   * @returns Array of test file paths
   */
  export async function findJavaTests(projectPath: string, testSourceDir: string = "src/test/java"): Promise<string[]> {
    const path = await import("path")
    const fs = await import("fs")

    const testDir = path.join(projectPath, testSourceDir)
    if (!fs.existsSync(testDir)) {
      return []
    }

    const testFiles: string[] = []

    const scanDir = async (dir: string): Promise<void> => {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          await scanDir(fullPath)
        } else if (entry.name.endsWith("Test.java") || entry.name.endsWith("Tests.java")) {
          testFiles.push(fullPath)
        }
      }
    }

    await scanDir(testDir)
    return testFiles
  }

  /**
   * Finds test files in a Python project
   * @param projectPath - Path to the project
   * @returns Array of test file paths
   */
  export async function findPythonTests(projectPath: string): Promise<string[]> {
    const path = await import("path")
    const fs = await import("fs")

    const testDirs = ["tests", "test", "."]
    const testFiles: string[] = []

    for (const testDir of testDirs) {
      const dir = path.join(projectPath, testDir)
      if (!fs.existsSync(dir)) continue

      const scanDir = async (d: string): Promise<void> => {
        const entries = fs.readdirSync(d, { withFileTypes: true })
        for (const entry of entries) {
          const fullPath = path.join(d, entry.name)
          if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "__pycache__") {
            await scanDir(fullPath)
          } else if (entry.name.startsWith("test_") && entry.name.endsWith(".py")) {
            testFiles.push(fullPath)
          } else if (entry.name.endsWith("_test.py")) {
            testFiles.push(fullPath)
          }
        }
      }

      await scanDir(dir)
    }

    return testFiles
  }

  /**
   * Detects if a project is a Python project
   * @param projectPath - Path to the project
   * @returns true if Python project indicators are found
   */
  export async function isPythonProject(projectPath: string): Promise<boolean> {
    const path = await import("path")
    const fs = await import("fs")

    const indicators = [
      "requirements.txt",
      "pyproject.toml",
      "setup.py",
      "Pipfile",
      "pytest.ini",
      "conftest.py",
      ".python-version",
    ]

    return indicators.some((indicator) => fs.existsSync(path.join(projectPath, indicator)))
  }

  /**
   * Gets the appropriate test command for a project
   * @param projectPath - Path to the project
   * @returns Test command object with command and args
   */
  export async function getTestCommand(
    projectPath: string,
  ): Promise<{ command: string; args: string[]; cwd: string } | null> {
    const { detectBuildTool } = await import("./build-tool-detector")

    // Check for Java project
    const buildConfig = await detectBuildTool(projectPath)
    if (buildConfig.tool === "maven") {
      return {
        command: "mvn",
        args: ["test"],
        cwd: projectPath,
      }
    }
    if (buildConfig.tool === "gradle") {
      return {
        command: "./gradlew",
        args: ["test"],
        cwd: projectPath,
      }
    }

    // Check for Python project
    if (await isPythonProject(projectPath)) {
      return {
        command: "pytest",
        args: ["-v"],
        cwd: projectPath,
      }
    }

    return null
  }
}
