import * as fs from "fs"
import * as path from "path"

export type BuildTool = "maven" | "gradle" | "unknown"

export interface BuildConfig {
  tool: BuildTool
  mainSourceDir: string
  testSourceDir: string
  buildFile: string | null
}

// In-memory cache for build configurations
const buildConfigCache = new Map<string, BuildConfig>()

/**
 * Detects the build tool (Maven or Gradle) for a project
 * @param projectPath - Path to the project directory
 * @returns BuildConfig with tool type and source/test directories
 */
export async function detectBuildTool(projectPath: string): Promise<BuildConfig> {
  // Check cache first
  if (buildConfigCache.has(projectPath)) {
    return buildConfigCache.get(projectPath)!
  }

  try {
    const config = await detectBuildToolImpl(projectPath)
    buildConfigCache.set(projectPath, config)
    return config
  } catch (error) {
    console.error(`Build detection failed for ${projectPath}:`, error)
    return getDefaultConfig()
  }
}

/**
 * Internal implementation of build tool detection
 */
async function detectBuildToolImpl(projectPath: string): Promise<BuildConfig> {
  // Check Maven first (more common)
  if (await isMavenProject(projectPath)) {
    return await parseMavenConfig(projectPath)
  }

  // Check Gradle second
  if (await isGradleProject(projectPath)) {
    return await parseGradleConfig(projectPath)
  }

  // Return sensible default (Java conventions)
  return getDefaultConfig()
}

/**
 * Checks if a project is a Maven project
 * @param projectPath - Path to the project directory
 * @returns true if pom.xml exists
 */
export async function isMavenProject(projectPath: string): Promise<boolean> {
  try {
    const pomPath = path.join(projectPath, "pom.xml")
    return fs.existsSync(pomPath)
  } catch (error) {
    return false
  }
}

/**
 * Checks if a project is a Gradle project
 * @param projectPath - Path to the project directory
 * @returns true if build.gradle or build.gradle.kts exists
 */
export async function isGradleProject(projectPath: string): Promise<boolean> {
  try {
    const gradleGroovy = path.join(projectPath, "build.gradle")
    const gradleKotlin = path.join(projectPath, "build.gradle.kts")
    return fs.existsSync(gradleGroovy) || fs.existsSync(gradleKotlin)
  } catch (error) {
    return false
  }
}

/**
 * Parses Maven project configuration
 * @param projectPath - Path to the Maven project
 * @returns BuildConfig for Maven project
 */
async function parseMavenConfig(projectPath: string): Promise<BuildConfig> {
  const pomPath = path.join(projectPath, "pom.xml")

  try {
    const pomContent = fs.readFileSync(pomPath, "utf-8")

    // Check if it's a Kotlin Maven project
    const isKotlin = pomContent.includes("<kotlin.version>") || pomContent.includes("kotlin-maven-plugin")

    return {
      tool: "maven",
      mainSourceDir: isKotlin ? "src/main/kotlin" : "src/main/java",
      testSourceDir: isKotlin ? "src/test/kotlin" : "src/test/java",
      buildFile: "pom.xml",
    }
  } catch (error) {
    // Fallback to Java conventions if parsing fails
    return {
      tool: "maven",
      mainSourceDir: "src/main/java",
      testSourceDir: "src/test/java",
      buildFile: "pom.xml",
    }
  }
}

/**
 * Parses Gradle project configuration
 * @param projectPath - Path to the Gradle project
 * @returns BuildConfig for Gradle project
 */
async function parseGradleConfig(projectPath: string): Promise<BuildConfig> {
  // Check for Kotlin DSL first
  const gradleKotlinPath = path.join(projectPath, "build.gradle.kts")
  const gradleGroovyPath = path.join(projectPath, "build.gradle")

  const buildFile = fs.existsSync(gradleKotlinPath) ? "build.gradle.kts" : "build.gradle"
  const gradleFilePath = path.join(projectPath, buildFile)

  try {
    const gradleContent = fs.readFileSync(gradleFilePath, "utf-8")

    // Check if it's a Kotlin project
    const isKotlin =
      buildFile === "build.gradle.kts" ||
      gradleContent.includes('id("org.jetbrains.kotlin') ||
      gradleContent.includes("id 'org.jetbrains.kotlin") ||
      gradleContent.includes("kotlin-gradle-plugin")

    return {
      tool: "gradle",
      mainSourceDir: isKotlin ? "src/main/kotlin" : "src/main/java",
      testSourceDir: isKotlin ? "src/test/kotlin" : "src/test/java",
      buildFile: buildFile,
    }
  } catch (error) {
    // Fallback to Java conventions if parsing fails
    return {
      tool: "gradle",
      mainSourceDir: "src/main/java",
      testSourceDir: "src/test/java",
      buildFile: buildFile,
    }
  }
}

/**
 * Parses Gradle dependencies (MVP implementation with simple string matching)
 * @param gradleContent - Content of build.gradle or build.gradle.kts
 * @returns Array of dependency identifiers
 */
export async function parseGradleDependencies(gradleContent: string): Promise<string[]> {
  const deps: string[] = []

  // Match common patterns in both Groovy and Kotlin DSL
  const patterns = [
    /implementation\s*\(?\s*['"]([^'"]+)['"]/g,
    /testImplementation\s*\(?\s*['"]([^'"]+)['"]/g,
    /id\s*\(?\s*['"]org\.springframework\.boot['"]/,
  ]

  for (const pattern of patterns) {
    let match
    // Reset regex lastIndex for global patterns
    pattern.lastIndex = 0
    while ((match = pattern.exec(gradleContent)) !== null) {
      deps.push(match[1] || "spring-boot")
    }
  }

  return deps
}

/**
 * Returns default build configuration (Java Maven conventions)
 * @returns Default BuildConfig
 */
function getDefaultConfig(): BuildConfig {
  return {
    tool: "unknown",
    mainSourceDir: "src/main/java",
    testSourceDir: "src/test/java",
    buildFile: null,
  }
}

/**
 * Clears the build configuration cache (useful for testing)
 */
export function clearBuildConfigCache(): void {
  buildConfigCache.clear()
}
