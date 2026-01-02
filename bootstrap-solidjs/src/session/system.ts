import { Ripgrep } from "../file/ripgrep"
import { Global } from "../global"
import { Filesystem } from "../util/filesystem"
import { Config } from "../config/config"

import { Instance } from "../project/instance"
import path from "path"
import os from "os"
import fs from "fs"

import PROMPT_ANTHROPIC from "./prompt/anthropic.txt"
import PROMPT_ANTHROPIC_WITHOUT_TODO from "./prompt/qwen.txt"
import PROMPT_BEAST from "./prompt/beast.txt"
import PROMPT_GEMINI from "./prompt/gemini.txt"
import PROMPT_ANTHROPIC_SPOOF from "./prompt/anthropic_spoof.txt"
import PROMPT_BOOTSTRAP from "./prompt/bootstrap.txt"

import PROMPT_CODEX from "./prompt/codex.txt"
import type { Provider } from "@/provider/provider"

export namespace SystemPrompt {
  export function header(providerID: string) {
    if (providerID.includes("anthropic")) return [PROMPT_ANTHROPIC_SPOOF.trim()]
    return []
  }

  export function provider(model: Provider.Model) {
    // Use Bootstrap prompt for all models (testing-focused)
    return [PROMPT_BOOTSTRAP]
  }

  export async function environment() {
    const project = Instance.project
    return [
      [
        `Here is some useful information about the environment you are running in:`,
        `<env>`,
        `  Working directory: ${Instance.directory}`,
        `  Is directory a git repo: ${project.vcs === "git" ? "yes" : "no"}`,
        `  Platform: ${process.platform}`,
        `  Today's date: ${new Date().toDateString()}`,
        `</env>`,
        `<files>`,
        `  ${
          project.vcs === "git" && false
            ? await Ripgrep.tree({
                cwd: Instance.directory,
                limit: 200,
              })
            : ""
        }`,
        `</files>`,
      ].join("\n"),
    ]
  }

  const LOCAL_RULE_FILES = [
    "AGENTS.md",
    "CLAUDE.md",
    "CONTEXT.md", // deprecated
  ]
  const GLOBAL_RULE_FILES = [
    path.join(Global.Path.config, "AGENTS.md"),
    path.join(os.homedir(), ".claude", "CLAUDE.md"),
  ]

  export async function custom() {
    const config = await Config.get()
    const paths = new Set<string>()

    for (const localRuleFile of LOCAL_RULE_FILES) {
      const matches = await Filesystem.findUp(localRuleFile, Instance.directory, Instance.worktree)
      if (matches.length > 0) {
        matches.forEach((path) => paths.add(path))
        break
      }
    }

    for (const globalRuleFile of GLOBAL_RULE_FILES) {
      if (await Bun.file(globalRuleFile).exists()) {
        paths.add(globalRuleFile)
        break
      }
    }

    if (config.instructions) {
      for (let instruction of config.instructions) {
        if (instruction.startsWith("~/")) {
          instruction = path.join(os.homedir(), instruction.slice(2))
        }
        let matches: string[] = []
        if (path.isAbsolute(instruction)) {
          matches = await Array.fromAsync(
            new Bun.Glob(path.basename(instruction)).scan({
              cwd: path.dirname(instruction),
              absolute: true,
              onlyFiles: true,
            }),
          ).catch(() => [])
        } else {
          matches = await Filesystem.globUp(instruction, Instance.directory, Instance.worktree).catch(() => [])
        }
        matches.forEach((path) => paths.add(path))
      }
    }

    const found = Array.from(paths).map((p) =>
      Bun.file(p)
        .text()
        .catch(() => "")
        .then((x) => "Instructions from: " + p + "\n" + x),
    )
    return Promise.all(found).then((result) => result.filter(Boolean))
  }

  /**
   * Detects project type (Java/Python) and returns testing-specific context
   */
  export async function testing(): Promise<string[]> {
    const projectPath = Instance.directory
    const context: string[] = []

    // Detect Java project
    const hasPom = fs.existsSync(path.join(projectPath, "pom.xml"))
    const hasGradle =
      fs.existsSync(path.join(projectPath, "build.gradle")) ||
      fs.existsSync(path.join(projectPath, "build.gradle.kts"))

    if (hasPom || hasGradle) {
      const buildTool = hasPom ? "Maven" : "Gradle"
      const testCommand = hasPom ? "mvn test" : "./gradlew test"

      // Check for Spring Boot
      let isSpringBoot = false
      if (hasPom) {
        try {
          const pomContent = fs.readFileSync(path.join(projectPath, "pom.xml"), "utf-8")
          isSpringBoot =
            pomContent.includes("spring-boot-starter") || pomContent.includes("spring-boot-starter-parent")
        } catch {}
      }
      if (hasGradle) {
        try {
          const gradleFile = fs.existsSync(path.join(projectPath, "build.gradle"))
            ? "build.gradle"
            : "build.gradle.kts"
          const gradleContent = fs.readFileSync(path.join(projectPath, gradleFile), "utf-8")
          isSpringBoot = gradleContent.includes("spring-boot")
        } catch {}
      }

      context.push(
        [
          `<testing-context>`,
          `  Project Type: Java (${buildTool})`,
          isSpringBoot ? `  Framework: Spring Boot` : ``,
          `  Test Command: ${testCommand}`,
          `  Test Directory: src/test/java/`,
          `</testing-context>`,
        ]
          .filter(Boolean)
          .join("\n"),
      )
    }

    // Detect Python project
    const pythonIndicators = [
      "requirements.txt",
      "pyproject.toml",
      "setup.py",
      "Pipfile",
      "pytest.ini",
      "conftest.py",
      ".python-version",
    ]

    const isPython = pythonIndicators.some((f) => fs.existsSync(path.join(projectPath, f)))

    if (isPython) {
      // Check for pytest.ini or conftest.py
      const hasPytestConfig =
        fs.existsSync(path.join(projectPath, "pytest.ini")) ||
        fs.existsSync(path.join(projectPath, "conftest.py")) ||
        fs.existsSync(path.join(projectPath, "pyproject.toml"))

      context.push(
        [
          `<testing-context>`,
          `  Project Type: Python`,
          `  Test Framework: pytest`,
          `  Test Command: pytest -v`,
          hasPytestConfig ? `  Config: pytest configuration detected` : ``,
          `</testing-context>`,
        ]
          .filter(Boolean)
          .join("\n"),
      )
    }

    return context
  }
}
