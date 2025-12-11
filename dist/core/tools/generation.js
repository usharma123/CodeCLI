import { colors } from "../../utils/colors.js";
import * as path from "path";
import { isSpringBootProject, detectComponentType, extractClassName, extractPackageName, } from "../../utils/springboot-detector.js";
import { generateSpringBootTest } from "./springboot-templates.js";
import { detectBuildTool } from "../../utils/build-tool-detector.js";
import { detectLanguage, resolveTestPath, } from "../../utils/path-resolver.js";
const generateTestsDefinition = {
    name: "generate_tests",
    description: "Analyze a source file and suggest test cases for it. Provide the file path and language. Optionally include coverage data to target gaps.",
    parameters: {
        type: "object",
        properties: {
            file_path: {
                type: "string",
                description: "Path to the source file to analyze",
            },
            language: {
                type: "string",
                enum: ["python", "java"],
                description: "Programming language of the file",
            },
            coverage_data: {
                type: "string",
                description: "Optional: Coverage data to identify specific uncovered lines",
            },
        },
        required: ["file_path", "language"],
    },
    function: async (input) => {
        try {
            console.log(`\n${colors.green}Generating tests for ${input.file_path}...${colors.reset}\n`);
            let sourceCode = "";
            try {
                sourceCode = await require("fs/promises").readFile(input.file_path, "utf-8");
            }
            catch (err) {
                throw new Error(`Could not read file: ${input.file_path}`);
            }
            let result = `Test Generation Analysis\n`;
            result += `${"=".repeat(50)}\n\n`;
            result += `File: ${input.file_path}\n`;
            result += `Language: ${input.language}\n\n`;
            if (input.language === "python") {
                result += `--- Python Code Analysis ---\n\n`;
                const functionPattern = /def\\s+(\\w+)\\s*\\([^)]*\\):/g;
                const functions = [];
                let match;
                while ((match = functionPattern.exec(sourceCode)) !== null) {
                    functions.push(match[1]);
                }
                result += `Found ${functions.length} function(s):\n`;
                functions.forEach((fn, idx) => {
                    result += `${idx + 1}. ${fn}()\n`;
                });
                result += `\n--- Test Generation Strategy ---\n\n`;
                result += `For each function, generate tests for:\n`;
                result += `1. Happy path (valid inputs, expected outputs)\n`;
                result += `2. Edge cases (empty, None, zero, negative values)\n`;
                result += `3. Error cases (invalid types, out of range)\n`;
                result += `4. Boundary conditions (min/max values)\n\n`;
                result += `--- Suggested Test File ---\n\n`;
                const testFileName = input.file_path.replace(".py", "_generated_test.py");
                result += `File: ${testFileName}\n\n`;
                result += `Structure:\n`;
                result += `\`\`\`python\n`;
                result += `import pytest\n`;
                result += `from ${require("path").basename(input.file_path, ".py")} import *\n\n`;
                functions.forEach((fn) => {
                    result += `class Test${fn.charAt(0).toUpperCase() + fn.slice(1)}:\n`;
                    result += `    \"\"\"Tests for ${fn} function\"\"\"\n\n`;
                    result += `    def test_${fn}_happy_path(self):\n`;
                    result += `        \"\"\"Test ${fn} with valid inputs\"\"\"\n`;
                    result += `        # TODO: Implement test\n`;
                    result += `        pass\n\n`;
                    result += `    def test_${fn}_edge_cases(self):\n`;
                    result += `        \"\"\"Test ${fn} with edge cases\"\"\"\n`;
                    result += `        # TODO: Test empty, None, zero\n`;
                    result += `        pass\n\n`;
                    result += `    def test_${fn}_error_handling(self):\n`;
                    result += `        \"\"\"Test ${fn} error handling\"\"\"\n`;
                    result += `        # TODO: Test invalid inputs\n`;
                    result += `        pass\n\n`;
                });
                result += `\`\`\`\n\n`;
            }
            else if (input.language === "java") {
                // Detect build tool and language
                const projectPath = path.dirname(input.file_path);
                const buildConfig = await detectBuildTool(projectPath);
                const language = detectLanguage(input.file_path);
                // Check if this is a Spring Boot project
                const isSpringBoot = await isSpringBootProject(projectPath, buildConfig);
                const componentType = detectComponentType(sourceCode);
                if (isSpringBoot && componentType) {
                    // Generate Spring Boot-specific test
                    result += `--- Spring Boot Test Generation ---\n\n`;
                    result += `${colors.green}Spring Boot project detected!${colors.reset}\n`;
                    result += `Build tool: ${colors.bold}${buildConfig.tool}${colors.reset}\n`;
                    result += `Language: ${colors.bold}${language}${colors.reset}\n`;
                    result += `Component type: ${colors.bold}${componentType}${colors.reset}\n\n`;
                    const className = extractClassName(sourceCode);
                    const packageName = extractPackageName(sourceCode);
                    if (!className || !packageName) {
                        result += `${colors.red}Error: Could not extract class name or package${colors.reset}\n`;
                        return result;
                    }
                    // Use robust path resolution
                    const testFilePath = resolveTestPath(input.file_path, buildConfig, language);
                    if (!testFilePath) {
                        result += `${colors.red}Error: Could not resolve test file path${colors.reset}\n`;
                        result += `Source path: ${input.file_path}\n`;
                        result += `Expected source dir: ${buildConfig.mainSourceDir}\n`;
                        return result;
                    }
                    result += `Test file will be created at: ${testFilePath}\n\n`;
                    // Generate component-specific guidance
                    const componentGuidance = {
                        controller: "Uses @WebMvcTest for fast slice testing with MockMvc. Mocks service dependencies. Perfect for testing HTTP endpoints in isolation.",
                        service: "Pure unit test with Mockito. No Spring context loaded (fastest). Mocks repository dependencies to test business logic.",
                        repository: "Uses @DataJpaTest with embedded H2 database. Tests custom queries and JPA operations. Automatically rolls back after each test.",
                        configuration: "Tests Spring configuration beans and their initialization.",
                        component: "Generic component test. Adjust based on component's specific role.",
                    };
                    result += `Test Strategy: ${componentGuidance[componentType]}\n\n`;
                    result += `Test Mode Mapping:\n`;
                    result += `- ${colors.green}smoke${colors.reset}: Unit/service tests (fastest, no Spring context)\n`;
                    result += `- ${colors.yellow}sanity${colors.reset}: Web/repository slice tests (medium, partial context)\n`;
                    result += `- ${colors.blue}full${colors.reset}: Integration tests (comprehensive, full context)\n\n`;
                    result += `--- Generated Spring Boot Test ---\n\n`;
                    result += `\`\`\`java\n`;
                    result += generateSpringBootTest(componentType, className, packageName);
                    result += `\`\`\`\n\n`;
                    result += `--- Next Steps ---\n`;
                    result += `1. Review the generated test file above\n`;
                    result += `2. Implement the TODO sections with actual test logic\n`;
                    result += `3. Run tests: run_tests --language java --mode ${componentType === "service" ? "smoke" : "sanity"}\n`;
                    result += `4. Add more edge cases and error handling tests\n`;
                    result += `5. Run with coverage: run_tests --language java --coverage true\n\n`;
                }
                else {
                    // Standard Java test generation (existing logic)
                    result += `--- Java Code Analysis ---\n\n`;
                    const classPattern = /class\\s+(\\w+)/g;
                    const methodPattern = /(?:public|private|protected)\\s+\\w+\\s+(\\w+)\\s*\\([^)]*\\)/g;
                    const classes = [];
                    const methods = [];
                    let match;
                    while ((match = classPattern.exec(sourceCode)) !== null) {
                        classes.push(match[1]);
                    }
                    while ((match = methodPattern.exec(sourceCode)) !== null) {
                        methods.push(match[1]);
                    }
                    result += `Found ${classes.length} class(es) and ${methods.length} method(s)\n\n`;
                    if (classes.length > 0) {
                        result += `Classes:\n`;
                        classes.forEach((cls, idx) => {
                            result += `${idx + 1}. ${cls}\n`;
                        });
                    }
                    result += `\nMethods:\n`;
                    methods.forEach((method, idx) => {
                        result += `${idx + 1}. ${method}()\n`;
                    });
                    result += `\n--- Suggested Test Structure ---\n`;
                    result += `For each method, create tests for:\n`;
                    result += `1. Valid inputs (expected behavior)\n`;
                    result += `2. Edge cases (null, empty, boundary values)\n`;
                    result += `3. Error conditions (exceptions, invalid inputs)\n\n`;
                    result += `--- Suggested Test Skeleton ---\n\n`;
                    const testFileName = input.file_path.replace(".java", "Test.java");
                    result += `File: ${testFileName}\n\n`;
                    result += `\`\`\`java\n`;
                    result += `import org.junit.jupiter.api.Test;\n`;
                    result += `import static org.junit.jupiter.api.Assertions.*;\n\n`;
                    if (classes.length > 0) {
                        const className = classes[0];
                        result += `class ${className}Test {\n`;
                        methods.forEach((method) => {
                            result += `    @Test\n`;
                            result += `    void test${method.charAt(0).toUpperCase() + method.slice(1)}() {\n`;
                            result += `        // TODO: Implement test for ${method}\n`;
                            result += `    }\n\n`;
                        });
                        result += `}\n`;
                    }
                    else {
                        result += `public class GeneratedTests {\n`;
                        methods.forEach((method) => {
                            result += `    @Test\n`;
                            result += `    void test${method.charAt(0).toUpperCase() + method.slice(1)}() {\n`;
                            result += `        // TODO: Implement test for ${method}\n`;
                            result += `    }\n\n`;
                        });
                        result += `}\n`;
                    }
                    result += `\`\`\`\n\n`;
                }
            }
            if (input.coverage_data) {
                result += `--- Coverage Hints ---\n`;
                result += `${input.coverage_data}\n\n`;
            }
            result += `Next Steps:\n`;
            result += `1. Use write_file to add the suggested test file\n`;
            result += `2. Fill in TODOs with real test cases\n`;
            result += `3. Run tests and adjust as needed\n`;
            return result;
        }
        catch (error) {
            throw new Error(`Failed to generate tests: ${error}`);
        }
    },
};
const analyzeCoverageGapsDefinition = {
    name: "analyze_coverage_gaps",
    description: "Identify files with low coverage and suggest areas to improve. Provide language and optional minimum coverage threshold.",
    parameters: {
        type: "object",
        properties: {
            language: {
                type: "string",
                enum: ["python", "java", "all"],
                description: "Language to analyze coverage gaps for",
            },
            min_coverage: {
                type: "number",
                description: "Minimum coverage threshold (default 80)",
            },
        },
        required: ["language"],
    },
    function: async (input) => {
        try {
            const language = input.language || "all";
            const minCoverage = input.min_coverage || 80;
            let result = `Coverage Gap Analysis (${language.toUpperCase()})\n`;
            result += `${"=".repeat(50)}\n\n`;
            result += `Minimum Coverage Target: ${minCoverage}%\n\n`;
            if (language === "python" || language === "all") {
                result += `Python Projects:\n`;
                result += `- Run: bash scripts/test-runner.sh --mode full --language python --coverage\n`;
                result += `- Review: tests/python/htmlcov/index.html\n`;
                result += `- Focus on: files with coverage < ${minCoverage}%\n\n`;
            }
            if (language === "java" || language === "all") {
                result += `Java Projects:\n`;
                result += `- Run: bash scripts/test-runner.sh --mode full --language java --coverage\n`;
                result += `- Review: tests/java/target/site/jacoco/index.html\n`;
                result += `- Focus on: packages/classes with coverage < ${minCoverage}%\n\n`;
            }
            result += `Suggested Workflow:\n`;
            result += `1. Run coverage for target language\n`;
            result += `2. Identify files/classes below threshold\n`;
            result += `3. Use generate_tests for those files\n`;
            result += `4. Rerun coverage to confirm improvements\n`;
            return result;
        }
        catch (error) {
            throw new Error(`Failed to analyze coverage gaps: ${error}`);
        }
    },
};
const generateRegressionTestDefinition = {
    name: "generate_regression_test",
    description: "Generate a regression test for a bug that was just fixed. Takes the bug description and fixed file, creates a test that verifies the fix and prevents the bug from reoccurring.",
    parameters: {
        type: "object",
        properties: {
            bug_description: {
                type: "string",
                description: "Description of the bug that was fixed (what was broken, how it was fixed)",
            },
            fixed_file: {
                type: "string",
                description: "Path to the file that was fixed",
            },
            language: {
                type: "string",
                enum: ["python", "java"],
                description: "Programming language",
            },
        },
        required: ["bug_description", "fixed_file", "language"],
    },
    function: async (input) => {
        try {
            console.log(`\n${colors.magenta}Generating regression test...${colors.reset}\n`);
            let result = `Regression Test Generation\n`;
            result += `${"=".repeat(50)}\n\n`;
            result += `Bug: ${input.bug_description}\n`;
            result += `Fixed File: ${input.fixed_file}\n`;
            result += `Language: ${input.language}\n\n`;
            result += `--- Regression Test Strategy ---\n\n`;
            result += `A regression test should:\n`;
            result += `1. Reproduce the exact bug scenario\n`;
            result += `2. Verify the fix works correctly\n`;
            result += `3. Use clear naming: test_regression_[bug_description]\n`;
            result += `4. Include a comment explaining the original bug\n`;
            result += `5. Test edge cases related to the bug\n\n`;
            if (input.language === "python") {
                const testFileName = input.fixed_file.replace(".py", "_regression_test.py");
                result += `--- Suggested Test ---\n\n`;
                result += `File: ${testFileName}\n\n`;
                result += `\`\`\`python\n`;
                result += `import pytest\n`;
                result += `from ${require("path").basename(input.fixed_file, ".py")} import *\n\n`;
                result += `def test_regression_${input.bug_description.toLowerCase().replace(/\\s+/g, "_").slice(0, 40)}():\n`;
                result += `    \"\"\"\n`;
                result += `    Regression test for bug:\n`;
                result += `    ${input.bug_description}\n`;
                result += `    \n`;
                result += `    This test ensures the bug does not reoccur.\n`;
                result += `    \"\"\"\n`;
                result += `    # Setup: Create the exact scenario that triggered the bug\n`;
                result += `    # TODO: Implement setup\n\n`;
                result += `    # Action: Execute the code that was previously failing\n`;
                result += `    # TODO: Implement action\n\n`;
                result += `    # Assert: Verify the fix works\n`;
                result += `    # TODO: Add assertions\n`;
                result += `    pass\n`;
                result += `\`\`\`\n\n`;
            }
            else if (input.language === "java") {
                const testFileName = input.fixed_file.replace(".java", "Test.java");
                result += `--- Suggested Test ---\n\n`;
                result += `File: ${testFileName}\n\n`;
                result += `\`\`\`java\n`;
                result += `import org.junit.jupiter.api.Test;\n`;
                result += `import org.junit.jupiter.api.DisplayName;\n`;
                result += `import static org.junit.jupiter.api.Assertions.*;\n\n`;
                result += `@Test\n`;
                result += `@DisplayName("Regression: ${input.bug_description.slice(0, 60)}")\n`;
                result += `public void testRegression${input.bug_description.replace(/\\s+/g, "_").slice(0, 40)}() {\n`;
                result += `    // Regression test for: ${input.bug_description}\n`;
                result += `    // This test ensures the bug does not reoccur.\n\n`;
                result += `    // Setup: Create scenario that triggered the bug\n`;
                result += `    // TODO: Implement setup\n\n`;
                result += `    // Action: Execute code that was previously failing\n`;
                result += `    // TODO: Implement action\n\n`;
                result += `    // Assert: Verify the fix works\n`;
                result += `    // TODO: Add assertions\n`;
                result += `}\n`;
                result += `\`\`\`\n\n`;
            }
            result += `--- Next Steps ---\n`;
            result += `1. Use write_file to create the regression test\n`;
            result += `2. Fill in the TODO sections with:\n`;
            result += `   - Setup code that reproduces the bug scenario\n`;
            result += `   - Action code that triggers the previously buggy behavior\n`;
            result += `   - Assertions that verify the fix\n`;
            result += `3. Run the test to ensure it passes\n`;
            result += `4. Mark the test with @pytest.mark.regression (Python) or @Tag("regression") (Java)\n`;
            return result;
        }
        catch (error) {
            throw new Error(`Failed to generate regression test: ${error}`);
        }
    },
};
export const generationTools = [
    generateTestsDefinition,
    analyzeCoverageGapsDefinition,
    generateRegressionTestDefinition,
];
