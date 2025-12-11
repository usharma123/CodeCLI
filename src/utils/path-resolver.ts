import { BuildConfig, Language } from "../core/types.js";
import * as path from "path";

/**
 * Detects the programming language from file extension
 * @param filePath - Path to the source file
 * @returns Language type (java, kotlin, or unknown)
 */
export function detectLanguage(filePath: string): Language {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".java") {
    return "java";
  } else if (ext === ".kt") {
    return "kotlin";
  } else {
    return "unknown";
  }
}

/**
 * Resolves the test file path from a source file path
 * Handles multi-module projects and different build tools
 *
 * @param sourcePath - Path to the source file
 * @param buildConfig - Build configuration with source/test directories
 * @param language - Programming language (java or kotlin)
 * @returns Test file path, or null if path cannot be resolved
 */
export function resolveTestPath(
  sourcePath: string,
  buildConfig: BuildConfig,
  language: Language
): string | null {
  // 1. Verify source path contains expected source directory
  if (!sourcePath.includes(buildConfig.mainSourceDir)) {
    console.warn(
      `Path ${sourcePath} doesn't match expected source dir ${buildConfig.mainSourceDir}`
    );
    return null; // Graceful failure
  }

  // 2. Replace LAST occurrence of mainSourceDir (handles multi-module projects)
  // This ensures we replace the correct src/main/java in paths like:
  // /parent/module1/src/main/java/com/example/Foo.java
  const lastIndex = sourcePath.lastIndexOf(buildConfig.mainSourceDir);
  const testPath =
    sourcePath.substring(0, lastIndex) +
    buildConfig.testSourceDir +
    sourcePath.substring(lastIndex + buildConfig.mainSourceDir.length);

  // 3. Change file extension to add "Test" suffix
  const extension = getFileExtension(language);
  const testFileName = testPath.replace(
    new RegExp(`\\.${extension}$`),
    `Test.${extension}`
  );

  return testFileName;
}

/**
 * Gets the file extension for a given language
 * @param language - Programming language
 * @returns File extension (without dot)
 */
export function getFileExtension(language: Language): string {
  switch (language) {
    case "java":
      return "java";
    case "kotlin":
      return "kt";
    default:
      return "java"; // Default to Java
  }
}

/**
 * Gets the test file extension for a given language
 * Includes the "Test" suffix in the filename
 * @param language - Programming language
 * @returns Test file pattern
 */
export function getTestFileExtension(language: Language): string {
  return `Test.${getFileExtension(language)}`;
}

/**
 * Validates that a source path matches the expected directory structure
 * @param sourcePath - Path to validate
 * @param buildConfig - Build configuration
 * @returns true if path is valid for the build config
 */
export function isValidSourcePath(
  sourcePath: string,
  buildConfig: BuildConfig
): boolean {
  return sourcePath.includes(buildConfig.mainSourceDir);
}

/**
 * Extracts the package-relative path from a full source path
 * Example: /project/src/main/java/com/example/Foo.java → com/example/Foo.java
 *
 * @param sourcePath - Full path to source file
 * @param buildConfig - Build configuration
 * @returns Package-relative path, or null if not found
 */
export function getPackageRelativePath(
  sourcePath: string,
  buildConfig: BuildConfig
): string | null {
  const sourceDir = buildConfig.mainSourceDir;
  const index = sourcePath.lastIndexOf(sourceDir);

  if (index === -1) {
    return null;
  }

  // Get the part after src/main/java/ (or src/main/kotlin/)
  const afterSourceDir = sourcePath.substring(
    index + sourceDir.length + 1 // +1 for the path separator
  );

  return afterSourceDir;
}
