/**
 * Tests for language detector
 * Tests Bug #21: Language detection for C#, Rust, Go
 */

import { describe, test, expect } from "bun:test";
import {
  detectLanguage,
  isLSPSupported,
  getSupportedExtensions,
  getSupportedLanguages
} from "../language-detector.js";

describe("detectLanguage", () => {
  describe("TypeScript detection", () => {
    test("should detect .ts files as typescript", () => {
      expect(detectLanguage("file.ts")).toBe("typescript");
      expect(detectLanguage("/path/to/file.ts")).toBe("typescript");
    });

    test("should detect .tsx files as typescript", () => {
      expect(detectLanguage("component.tsx")).toBe("typescript");
    });

    test("should detect .mts files as typescript", () => {
      expect(detectLanguage("module.mts")).toBe("typescript");
    });

    test("should detect .cts files as typescript", () => {
      expect(detectLanguage("module.cts")).toBe("typescript");
    });
  });

  describe("JavaScript detection", () => {
    test("should detect .js files as javascript", () => {
      expect(detectLanguage("file.js")).toBe("javascript");
    });

    test("should detect .jsx files as javascript", () => {
      expect(detectLanguage("component.jsx")).toBe("javascript");
    });

    test("should detect .mjs files as javascript", () => {
      expect(detectLanguage("module.mjs")).toBe("javascript");
    });

    test("should detect .cjs files as javascript", () => {
      expect(detectLanguage("module.cjs")).toBe("javascript");
    });
  });

  describe("Python detection", () => {
    test("should detect .py files as python", () => {
      expect(detectLanguage("script.py")).toBe("python");
    });

    test("should detect .pyw files as python", () => {
      expect(detectLanguage("script.pyw")).toBe("python");
    });

    test("should detect .pyi files as python", () => {
      expect(detectLanguage("stubs.pyi")).toBe("python");
    });
  });

  describe("Java detection", () => {
    test("should detect .java files as java", () => {
      expect(detectLanguage("Main.java")).toBe("java");
    });
  });

  describe("Kotlin detection", () => {
    test("should detect .kt files as kotlin", () => {
      expect(detectLanguage("Main.kt")).toBe("kotlin");
    });

    test("should detect .kts files as kotlin", () => {
      expect(detectLanguage("build.gradle.kts")).toBe("kotlin");
    });
  });

  describe("C# detection (Bug #21)", () => {
    test("should detect .cs files as csharp", () => {
      expect(detectLanguage("Program.cs")).toBe("csharp");
      expect(detectLanguage("/path/to/MyClass.cs")).toBe("csharp");
    });

    test("should detect .csx files as csharp", () => {
      expect(detectLanguage("script.csx")).toBe("csharp");
    });
  });

  describe("Rust detection (Bug #21)", () => {
    test("should detect .rs files as rust", () => {
      expect(detectLanguage("main.rs")).toBe("rust");
      expect(detectLanguage("/path/to/lib.rs")).toBe("rust");
    });
  });

  describe("Go detection (Bug #21)", () => {
    test("should detect .go files as go", () => {
      expect(detectLanguage("main.go")).toBe("go");
      expect(detectLanguage("/path/to/handler.go")).toBe("go");
    });
  });

  describe("Unsupported files", () => {
    test("should return undefined for unsupported extensions", () => {
      expect(detectLanguage("file.txt")).toBeUndefined();
      expect(detectLanguage("file.md")).toBeUndefined();
      expect(detectLanguage("file.json")).toBeUndefined();
      expect(detectLanguage("file.yaml")).toBeUndefined();
      expect(detectLanguage("file.html")).toBeUndefined();
      expect(detectLanguage("file.css")).toBeUndefined();
    });

    test("should return undefined for files without extension", () => {
      expect(detectLanguage("Makefile")).toBeUndefined();
      expect(detectLanguage("Dockerfile")).toBeUndefined();
    });

    test("should handle edge cases", () => {
      expect(detectLanguage("")).toBeUndefined();
      expect(detectLanguage(".")).toBeUndefined();
    });
  });

  describe("Case sensitivity", () => {
    test("should handle uppercase extensions", () => {
      expect(detectLanguage("file.TS")).toBe("typescript");
      expect(detectLanguage("file.JS")).toBe("javascript");
      expect(detectLanguage("file.PY")).toBe("python");
      expect(detectLanguage("file.CS")).toBe("csharp");
      expect(detectLanguage("file.RS")).toBe("rust");
      expect(detectLanguage("file.GO")).toBe("go");
    });

    test("should handle mixed case extensions", () => {
      expect(detectLanguage("file.Ts")).toBe("typescript");
      expect(detectLanguage("file.Js")).toBe("javascript");
    });
  });
});

describe("isLSPSupported", () => {
  test("should return true for supported files", () => {
    expect(isLSPSupported("file.ts")).toBe(true);
    expect(isLSPSupported("file.js")).toBe(true);
    expect(isLSPSupported("file.py")).toBe(true);
    expect(isLSPSupported("file.java")).toBe(true);
    expect(isLSPSupported("file.kt")).toBe(true);
    expect(isLSPSupported("file.cs")).toBe(true);
    expect(isLSPSupported("file.rs")).toBe(true);
    expect(isLSPSupported("file.go")).toBe(true);
  });

  test("should return false for unsupported files", () => {
    expect(isLSPSupported("file.txt")).toBe(false);
    expect(isLSPSupported("file.md")).toBe(false);
    expect(isLSPSupported("file.json")).toBe(false);
  });
});

describe("getSupportedExtensions", () => {
  test("should return all supported extensions", () => {
    const extensions = getSupportedExtensions();

    // Check for basic extensions
    expect(extensions).toContain("ts");
    expect(extensions).toContain("js");
    expect(extensions).toContain("py");
    expect(extensions).toContain("java");
    expect(extensions).toContain("kt");

    // Check for new extensions (Bug #21)
    expect(extensions).toContain("cs");
    expect(extensions).toContain("rs");
    expect(extensions).toContain("go");
  });

  test("should return an array", () => {
    expect(Array.isArray(getSupportedExtensions())).toBe(true);
  });
});

describe("getSupportedLanguages", () => {
  test("should return all supported languages", () => {
    const languages = getSupportedLanguages();

    expect(languages).toContain("typescript");
    expect(languages).toContain("javascript");
    expect(languages).toContain("python");
    expect(languages).toContain("java");
    expect(languages).toContain("kotlin");

    // New languages (Bug #21)
    expect(languages).toContain("csharp");
    expect(languages).toContain("rust");
    expect(languages).toContain("go");
  });

  test("should not contain duplicates", () => {
    const languages = getSupportedLanguages();
    const uniqueLanguages = [...new Set(languages)];
    expect(languages.length).toBe(uniqueLanguages.length);
  });
});
