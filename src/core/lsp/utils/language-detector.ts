/**
 * Language Detector - Detect language from file extensions
 *
 * Maps file extensions to LSP language identifiers
 */

import type { LSPLanguage } from "../types.js";

// File extension to language mapping
const extensionToLanguage: Record<string, LSPLanguage> = {
  // TypeScript
  ts: "typescript",
  tsx: "typescript",
  mts: "typescript",
  cts: "typescript",

  // JavaScript
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",

  // Python
  py: "python",
  pyw: "python",
  pyi: "python",

  // Java
  java: "java",

  // Kotlin
  kt: "kotlin",
  kts: "kotlin",

  // C# (Bug #21 - language detection gaps)
  cs: "csharp",
  csx: "csharp",

  // Rust (Bug #21 - language detection gaps)
  rs: "rust",

  // Go (Bug #21 - language detection gaps)
  go: "go",
};

/**
 * Detect the LSP language for a file based on its extension
 * @param filePath The file path to detect language for
 * @returns The detected language or undefined if not supported
 */
export function detectLanguage(filePath: string): LSPLanguage | undefined {
  const ext = filePath.split(".").pop()?.toLowerCase();
  if (!ext) return undefined;
  return extensionToLanguage[ext];
}

/**
 * Check if a file is supported by LSP
 * @param filePath The file path to check
 * @returns True if the file type is supported
 */
export function isLSPSupported(filePath: string): boolean {
  return detectLanguage(filePath) !== undefined;
}

/**
 * Get all supported file extensions
 */
export function getSupportedExtensions(): string[] {
  return Object.keys(extensionToLanguage);
}

/**
 * Get all supported languages
 */
export function getSupportedLanguages(): LSPLanguage[] {
  return [...new Set(Object.values(extensionToLanguage))];
}
