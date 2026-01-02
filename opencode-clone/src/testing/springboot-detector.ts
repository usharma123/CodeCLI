import * as fs from "fs"
import * as path from "path"
import { type BuildConfig, parseGradleDependencies } from "./build-tool-detector"

/**
 * Spring Boot component types that can be detected from annotations
 */
export type SpringBootComponentType = "controller" | "service" | "repository" | "configuration" | "component"

/**
 * Repository types for specialized test generation
 */
export type RepositoryType = "jpa" | "mongo" | "redis" | "reactive" | "jdbc" | "unknown"

/**
 * Checks if a project is a Spring Boot project
 * Supports both Maven (pom.xml) and Gradle (build.gradle/build.gradle.kts)
 *
 * @param projectPath - Path to the project directory
 * @param buildConfig - Build configuration (optional, will be detected if not provided)
 * @returns true if Spring Boot dependencies are found
 */
export async function isSpringBootProject(projectPath: string, buildConfig?: BuildConfig): Promise<boolean> {
  try {
    // If no build config provided, check both Maven and Gradle
    if (!buildConfig) {
      return (await isSpringBootMavenProject(projectPath)) || (await isSpringBootGradleProject(projectPath))
    }

    // Check based on build tool
    if (buildConfig.tool === "maven") {
      return await isSpringBootMavenProject(projectPath)
    } else if (buildConfig.tool === "gradle") {
      return await isSpringBootGradleProject(projectPath)
    }

    return false
  } catch (error) {
    return false
  }
}

/**
 * Checks if a Maven project is a Spring Boot project
 */
async function isSpringBootMavenProject(projectPath: string): Promise<boolean> {
  try {
    const pomPath = path.join(projectPath, "pom.xml")

    if (!fs.existsSync(pomPath)) {
      return false
    }

    const pomContent = fs.readFileSync(pomPath, "utf-8")

    // Check for Spring Boot starter dependencies
    const springBootIndicators = [
      "spring-boot-starter-test",
      "spring-boot-starter-web",
      "spring-boot-starter-webflux",
      "spring-boot-starter-data-jpa",
      "spring-boot-starter-data-mongodb",
      "spring-boot-starter-data-redis",
      "spring-boot-starter-parent",
      "org.springframework.boot",
    ]

    return springBootIndicators.some((indicator) => pomContent.includes(indicator))
  } catch (error) {
    return false
  }
}

/**
 * Checks if a Gradle project is a Spring Boot project
 */
async function isSpringBootGradleProject(projectPath: string): Promise<boolean> {
  try {
    const gradleKotlinPath = path.join(projectPath, "build.gradle.kts")
    const gradleGroovyPath = path.join(projectPath, "build.gradle")

    let gradleContent = ""

    if (fs.existsSync(gradleKotlinPath)) {
      gradleContent = fs.readFileSync(gradleKotlinPath, "utf-8")
    } else if (fs.existsSync(gradleGroovyPath)) {
      gradleContent = fs.readFileSync(gradleGroovyPath, "utf-8")
    } else {
      return false
    }

    // Check for Spring Boot plugin or dependencies
    const springBootIndicators = [
      'id("org.springframework.boot")',
      "id 'org.springframework.boot'",
      "spring-boot-starter",
      "org.springframework.boot:spring-boot",
    ]

    return springBootIndicators.some((indicator) => gradleContent.includes(indicator))
  } catch (error) {
    return false
  }
}

/**
 * Checks if a project uses reactive stack (WebFlux)
 * @param projectPath - Path to the project directory
 * @param buildConfig - Build configuration
 * @returns true if WebFlux dependencies are found
 */
export async function isReactiveProject(projectPath: string, buildConfig?: BuildConfig): Promise<boolean> {
  try {
    if (!buildConfig || buildConfig.tool === "maven") {
      const pomPath = path.join(projectPath, "pom.xml")
      if (fs.existsSync(pomPath)) {
        const pomContent = fs.readFileSync(pomPath, "utf-8")
        return (
          pomContent.includes("spring-boot-starter-webflux") ||
          pomContent.includes("spring-boot-starter-data-r2dbc") ||
          pomContent.includes("spring-boot-starter-data-mongodb-reactive")
        )
      }
    }

    if (!buildConfig || buildConfig.tool === "gradle") {
      const gradleFiles = ["build.gradle.kts", "build.gradle"].map((f) => path.join(projectPath, f))

      for (const gradleFile of gradleFiles) {
        if (fs.existsSync(gradleFile)) {
          const gradleContent = fs.readFileSync(gradleFile, "utf-8")
          if (
            gradleContent.includes("spring-boot-starter-webflux") ||
            gradleContent.includes("spring-boot-starter-data-r2dbc") ||
            gradleContent.includes("spring-boot-starter-data-mongodb-reactive")
          ) {
            return true
          }
        }
      }
    }

    return false
  } catch (error) {
    return false
  }
}

/**
 * Detects the Spring Boot component type from source code annotations
 * @param sourceCode - Java source code content
 * @returns The component type or null if not a Spring Boot component
 */
export function detectComponentType(sourceCode: string): SpringBootComponentType | null {
  // Check for controller annotations (order matters - RestController extends Controller)
  if (/@RestController\b/.test(sourceCode)) {
    return "controller"
  }
  if (/@Controller\b/.test(sourceCode)) {
    return "controller"
  }

  // Check for service annotation
  if (/@Service\b/.test(sourceCode)) {
    return "service"
  }

  // Check for repository annotations
  if (/@Repository\b/.test(sourceCode)) {
    return "repository"
  }

  // Check for various Spring Data repository interfaces
  const repositoryPatterns = [
    /extends\s+JpaRepository\b/,
    /extends\s+CrudRepository\b/,
    /extends\s+PagingAndSortingRepository\b/,
    /extends\s+MongoRepository\b/,
    /extends\s+RedisRepository\b/,
    /extends\s+JdbcRepository\b/,
    /extends\s+ReactiveCrudRepository\b/,
    /extends\s+ReactiveMongoRepository\b/,
    /extends\s+ReactiveSortingRepository\b/,
  ]

  if (repositoryPatterns.some((pattern) => pattern.test(sourceCode))) {
    return "repository"
  }

  // Check for configuration annotation
  if (/@Configuration\b/.test(sourceCode)) {
    return "configuration"
  }

  // Check for generic component annotation
  if (/@Component\b/.test(sourceCode)) {
    return "component"
  }

  return null
}

/**
 * Detects the specific type of repository from source code
 * @param sourceCode - Java/Kotlin source code content
 * @returns Repository type (jpa, mongo, redis, reactive, jdbc, or unknown)
 */
export function detectRepositoryType(sourceCode: string): RepositoryType {
  // Check for reactive repositories first
  if (
    /extends\s+ReactiveCrudRepository\b/.test(sourceCode) ||
    /extends\s+ReactiveMongoRepository\b/.test(sourceCode) ||
    /extends\s+ReactiveSortingRepository\b/.test(sourceCode)
  ) {
    return "reactive"
  }

  // Check for NoSQL repositories
  if (/extends\s+MongoRepository\b/.test(sourceCode)) {
    return "mongo"
  }

  if (/extends\s+RedisRepository\b/.test(sourceCode)) {
    return "redis"
  }

  // Check for JDBC repositories
  if (/extends\s+JdbcRepository\b/.test(sourceCode)) {
    return "jdbc"
  }

  // Check for JPA repositories (most common)
  if (
    /extends\s+JpaRepository\b/.test(sourceCode) ||
    /extends\s+CrudRepository\b/.test(sourceCode) ||
    /extends\s+PagingAndSortingRepository\b/.test(sourceCode)
  ) {
    return "jpa"
  }

  return "unknown"
}

/**
 * Extracts the class name from Java or Kotlin source code
 * @param sourceCode - Java or Kotlin source code content
 * @returns The class name or null if not found
 */
export function extractClassName(sourceCode: string): string | null {
  // Match Java/Kotlin class declarations (including 'data class', 'object', etc.)
  const classMatch = sourceCode.match(/(?:public\s+)?(?:data\s+class|sealed\s+class|class|interface|object)\s+(\w+)/)
  return classMatch ? classMatch[1] : null
}

/**
 * Extracts the package name from Java or Kotlin source code
 * @param sourceCode - Java or Kotlin source code content
 * @returns The package name or null if not found
 */
export function extractPackageName(sourceCode: string): string | null {
  // Match both Java (with semicolon) and Kotlin (without semicolon)
  const packageMatch = sourceCode.match(/package\s+([\w.]+);?/)
  return packageMatch ? packageMatch[1] : null
}

/**
 * Finds the application.yml or application.properties test config file
 * @param projectPath - Path to the project directory
 * @returns Path to the test config file or null if not found
 */
export async function findTestConfiguration(projectPath: string): Promise<string | null> {
  const possiblePaths = [
    path.join(projectPath, "src/test/resources/application-test.yml"),
    path.join(projectPath, "src/test/resources/application-test.properties"),
    path.join(projectPath, "src/test/resources/application.yml"),
    path.join(projectPath, "src/test/resources/application.properties"),
  ]

  for (const configPath of possiblePaths) {
    if (fs.existsSync(configPath)) {
      return configPath
    }
  }

  return null
}

/**
 * Checks if a Java file is a main Application class (entry point)
 * @param sourceCode - Java source code content
 * @returns true if it's a Spring Boot application class
 */
export function isApplicationClass(sourceCode: string): boolean {
  return /@SpringBootApplication\b/.test(sourceCode)
}
