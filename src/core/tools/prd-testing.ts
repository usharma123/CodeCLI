import {
  ToolDefinition,
  ParsePRDInput,
  GenerateTestsFromPRDInput,
  GeneratePerformanceTestInput,
} from "../types.js";
import { colors } from "../../utils/colors.js";
import * as fs from "fs/promises";
import * as path from "path";

const parsePRDDefinition: ToolDefinition = {
  name: "parse_prd",
  description:
    "Parse a Product Requirements Document (PRD) to extract testable requirements. Supports markdown, text, and PDF files. Converts requirements into structured test cases.",
  parameters: {
    type: "object",
    properties: {
      prd_file: {
        type: "string",
        description: "Path to the PRD file (*.md, *.txt, *.pdf)",
      },
      output_format: {
        type: "string",
        enum: ["markdown", "json"],
        description: "Output format for test cases (default: markdown)",
      },
    },
    required: ["prd_file"],
  },
  function: async (input: ParsePRDInput) => {
    try {
      console.log(
        `\n${colors.magenta}Parsing PRD: ${input.prd_file}...${colors.reset}\n`
      );

      const ext = path.extname(input.prd_file).toLowerCase();
      let prdContent = "";

      if (ext === ".md" || ext === ".txt") {
        try {
          prdContent = await fs.readFile(input.prd_file, "utf-8");
        } catch (err) {
          throw new Error(`Could not read file: ${input.prd_file}`);
        }
      } else if (ext === ".pdf") {
        return `PDF parsing requires additional dependencies.

To parse PDF files:
1. Install pdf-parse: npm install pdf-parse
2. Alternatively, convert PDF to markdown first:
   - Use online tools like pdf2md.io
   - Or install pandoc: brew install pandoc
   - Then run: pandoc ${input.prd_file} -o prd.md

For now, please provide the PRD as a .md or .txt file.`;
      } else {
        throw new Error(`Unsupported file format: ${ext}. Use .md, .txt, or .pdf`);
      }

      let result = `PRD Test Case Extraction\n`;
      result += `${"=".repeat(50)}\n\n`;
      result += `Source: ${input.prd_file}\n`;
      result += `Format: ${input.output_format || "markdown"}\n\n`;

      result += `--- Requirement Analysis ---\n\n`;

      // Extract requirements using patterns
      const requirementPatterns = [
        /^#{1,3}\\s+(.+)$/gm, // Headers as features
        /(?:must|should|shall)\\s+(.+?)(?:\.|$)/gi, // Modal verbs
        /(?:the system|the user|the application)\\s+(.+?)(?:\.|$)/gi, // Actions
      ];

      const requirements: string[] = [];
      requirementPatterns.forEach((pattern) => {
        const matches = prdContent.matchAll(pattern);
        for (const match of matches) {
          if (match[1] && !requirements.includes(match[1].trim())) {
            requirements.push(match[1].trim());
          }
        }
      });

      result += `Found ${requirements.length} potential requirements:\n\n`;
      requirements.slice(0, 10).forEach((req, idx) => {
        result += `${idx + 1}. ${req}\n`;
      });

      if (requirements.length > 10) {
        result += `... and ${requirements.length - 10} more\n`;
      }

      result += `\n--- Test Case Generation Strategy ---\n\n`;
      result += `For each requirement, generate:\n`;
      result += `1. **Unit Tests**: Test individual components\n`;
      result += `2. **Integration Tests**: Test component interactions\n`;
      result += `3. **System Tests**: Test end-to-end workflows\n`;
      result += `4. **UAT Scenarios**: Test user acceptance criteria\n\n`;

      result += `--- Structured Test Cases ---\n\n`;

      if (input.output_format === "json") {
        result += `\`\`\`json\n`;
        result += `{\n`;
        result += `  "source": "${input.prd_file}",\n`;
        result += `  "test_cases": [\n`;

        requirements.slice(0, 5).forEach((req, idx) => {
          result += `    {\n`;
          result += `      "requirement": "${req.replace(/"/g, '\\"')}",\n`;
          result += `      "test_type": "unit|integration|system|uat",\n`;
          result += `      "given": "Initial state or context",\n`;
          result += `      "when": "Action or event",\n`;
          result += `      "then": "Expected outcome"\n`;
          result += `    }${idx < 4 ? "," : ""}\n`;
        });

        result += `  ]\n`;
        result += `}\n`;
        result += `\`\`\`\n\n`;
      } else {
        result += `## Test Cases (Given/When/Then Format)\n\n`;

        requirements.slice(0, 5).forEach((req, idx) => {
          result += `### TC${idx + 1}: ${req}\n\n`;
          result += `**Type**: Unit | Integration | System | UAT\n\n`;
          result += `**Given**: [Initial state or context]\n`;
          result += `**When**: [Action or event]\n`;
          result += `**Then**: [Expected outcome]\n\n`;
          result += `---\n\n`;
        });
      }

      result += `--- Next Steps ---\n`;
      result += `1. Review extracted requirements for accuracy\n`;
      result += `2. Refine test cases with specific inputs/outputs\n`;
      result += `3. Use generate_tests_from_prd to create test code\n`;
      result += `4. Map test cases to test suites (unit/integration/system)\n`;

      return result;
    } catch (error) {
      throw new Error(`Failed to parse PRD: ${error}`);
    }
  },
};

const generateTestsFromPRDDefinition: ToolDefinition = {
  name: "generate_tests_from_prd",
  description:
    "Generate test code from PRD test cases. Takes structured test cases (from parse_prd) and creates executable test files.",
  parameters: {
    type: "object",
    properties: {
      test_cases_file: {
        type: "string",
        description: "Path to the structured test cases file (JSON or markdown)",
      },
      language: {
        type: "string",
        enum: ["python", "java", "javascript"],
        description: "Programming language for tests",
      },
      test_suite: {
        type: "string",
        enum: ["unit", "integration", "system", "uat"],
        description: "Type of test suite to generate",
      },
    },
    required: ["test_cases_file", "language", "test_suite"],
  },
  function: async (input: GenerateTestsFromPRDInput) => {
    try {
      console.log(
        `\n${colors.cyan}Generating ${input.test_suite} tests from PRD...${colors.reset}\n`
      );

      let result = `PRD-Based Test Generation\n`;
      result += `${"=".repeat(50)}\n\n`;
      result += `Source: ${input.test_cases_file}\n`;
      result += `Language: ${input.language}\n`;
      result += `Suite: ${input.test_suite}\n\n`;

      result += `--- Test Structure ---\n\n`;

      if (input.language === "python") {
        result += `\`\`\`python\n`;
        result += `import pytest\n`;
        result += `from your_module import *\n\n`;

        if (input.test_suite === "unit") {
          result += `@pytest.mark.unit\n`;
          result += `class TestPRDRequirements:\n`;
          result += `    \"\"\"Unit tests generated from PRD requirements\"\"\"\n\n`;
          result += `    def test_requirement_1(self):\n`;
          result += `        \"\"\"Given [context], when [action], then [outcome]\"\"\"\n`;
          result += `        # Arrange\n`;
          result += `        # TODO: Set up test data\n\n`;
          result += `        # Act\n`;
          result += `        # TODO: Execute function\n\n`;
          result += `        # Assert\n`;
          result += `        # TODO: Verify outcome\n`;
          result += `        pass\n`;
        } else if (input.test_suite === "integration") {
          result += `@pytest.mark.integration\n`;
          result += `class TestPRDIntegration:\n`;
          result += `    \"\"\"Integration tests from PRD\"\"\"\n\n`;
          result += `    @pytest.fixture\n`;
          result += `    def setup_system(self):\n`;
          result += `        # TODO: Set up integrated system\n`;
          result += `        pass\n\n`;
          result += `    def test_integration_scenario(self, setup_system):\n`;
          result += `        \"\"\"Test multi-component interaction\"\"\"\n`;
          result += `        # TODO: Implement integration test\n`;
          result += `        pass\n`;
        } else if (input.test_suite === "system" || input.test_suite === "uat") {
          result += `@pytest.mark.system\n`;
          result += `class TestPRDSystemScenarios:\n`;
          result += `    \"\"\"End-to-end scenarios from PRD\"\"\"\n\n`;
          result += `    def test_user_journey(self):\n`;
          result += `        \"\"\"Complete user workflow from PRD\"\"\"\n`;
          result += `        # TODO: Implement E2E scenario\n`;
          result += `        pass\n`;
        }

        result += `\`\`\`\n\n`;
      } else if (input.language === "java") {
        result += `\`\`\`java\n`;
        result += `import org.junit.jupiter.api.*;\n`;
        result += `import static org.junit.jupiter.api.Assertions.*;\n\n`;

        const tag = input.test_suite;
        result += `@Tag("${tag}")\n`;
        result += `class PRDRequirementsTest {\n\n`;
        result += `    @Test\n`;
        result += `    @DisplayName("PRD Requirement 1")\n`;
        result += `    void testRequirement1() {\n`;
        result += `        // Given: [context]\n`;
        result += `        // TODO: Set up test data\n\n`;
        result += `        // When: [action]\n`;
        result += `        // TODO: Execute operation\n\n`;
        result += `        // Then: [outcome]\n`;
        result += `        // TODO: Verify results\n`;
        result += `    }\n`;
        result += `}\n`;
        result += `\`\`\`\n\n`;
      }

      result += `--- Mapping PRD to Tests ---\n\n`;
      result += `| PRD Section | Test Type | Test File |\n`;
      result += `|------------|-----------|----------|\n`;
      result += `| Functional Requirements | Unit Tests | test_unit_*.${input.language === "java" ? "java" : "py"} |\n`;
      result += `| API Specs | Integration Tests | test_integration_*.${input.language === "java" ? "java" : "py"} |\n`;
      result += `| User Stories | System/UAT Tests | test_system_*.${input.language === "java" ? "java" : "py"} |\n\n`;

      result += `--- Next Steps ---\n`;
      result += `1. Create test files with write_file\n`;
      result += `2. Fill in TODO sections with specific test logic\n`;
      result += `3. Run tests with appropriate markers:\n`;
      result += `   - pytest -m ${input.test_suite} (Python)\n`;
      result += `   - mvn test -Dgroups=${input.test_suite} (Java)\n`;

      return result;
    } catch (error) {
      throw new Error(`Failed to generate tests from PRD: ${error}`);
    }
  },
};

const generatePerformanceTestDefinition: ToolDefinition = {
  name: "generate_performance_test",
  description:
    "Generate performance and load tests for APIs or applications. Creates test scripts with configurable load patterns.",
  parameters: {
    type: "object",
    properties: {
      target_url: {
        type: "string",
        description: "URL or endpoint to test",
      },
      test_type: {
        type: "string",
        enum: ["load", "stress", "spike", "endurance"],
        description: "Type of performance test",
      },
      tool: {
        type: "string",
        enum: ["k6", "jmeter", "locust", "artillery"],
        description: "Performance testing tool",
      },
    },
    required: ["target_url", "test_type"],
  },
  function: async (input: GeneratePerformanceTestInput) => {
    try {
      console.log(
        `\n${colors.yellow}Generating ${input.test_type} test...${colors.reset}\n`
      );

      const tool = input.tool || "k6";

      let result = `Performance Test Generation\n`;
      result += `${"=".repeat(50)}\n\n`;
      result += `Target: ${input.target_url}\n`;
      result += `Test Type: ${input.test_type}\n`;
      result += `Tool: ${tool}\n\n`;

      result += `--- Performance Test Strategy ---\n\n`;

      if (input.test_type === "load") {
        result += `**Load Test**: Verify system behavior under expected load\n`;
        result += `- Gradual ramp-up of users\n`;
        result += `- Sustain peak load for duration\n`;
        result += `- Measure response times and throughput\n\n`;
      } else if (input.test_type === "stress") {
        result += `**Stress Test**: Find system breaking point\n`;
        result += `- Push beyond normal capacity\n`;
        result += `- Identify maximum load\n`;
        result += `- Test recovery behavior\n\n`;
      } else if (input.test_type === "spike") {
        result += `**Spike Test**: Test sudden traffic surge\n`;
        result += `- Immediate jump to high load\n`;
        result += `- Test auto-scaling\n`;
        result += `- Verify system stability\n\n`;
      } else if (input.test_type === "endurance") {
        result += `**Endurance Test**: Test system over extended time\n`;
        result += `- Sustained moderate load\n`;
        result += `- Detect memory leaks\n`;
        result += `- Monitor resource usage\n\n`;
      }

      if (tool === "k6") {
        result += `--- K6 Test Script ---\n\n`;
        result += `\`\`\`javascript\n`;
        result += `import http from 'k6/http';\n`;
        result += `import { check, sleep } from 'k6';\n\n`;

        result += `export const options = {\n`;

        if (input.test_type === "load") {
          result += `  stages: [\n`;
          result += `    { duration: '2m', target: 100 },  // Ramp up to 100 users\n`;
          result += `    { duration: '5m', target: 100 },  // Stay at 100 users\n`;
          result += `    { duration: '2m', target: 0 },    // Ramp down\n`;
          result += `  ],\n`;
        } else if (input.test_type === "stress") {
          result += `  stages: [\n`;
          result += `    { duration: '2m', target: 100 },\n`;
          result += `    { duration: '5m', target: 200 },\n`;
          result += `    { duration: '2m', target: 300 },\n`;
          result += `    { duration: '5m', target: 400 },\n`;
          result += `    { duration: '10m', target: 0 },\n`;
          result += `  ],\n`;
        } else if (input.test_type === "spike") {
          result += `  stages: [\n`;
          result += `    { duration: '10s', target: 500 },  // Spike to 500 users\n`;
          result += `    { duration: '1m', target: 500 },   // Sustain\n`;
          result += `    { duration: '10s', target: 0 },    // Drop\n`;
          result += `  ],\n`;
        } else if (input.test_type === "endurance") {
          result += `  stages: [\n`;
          result += `    { duration: '2m', target: 50 },\n`;
          result += `    { duration: '3h', target: 50 },   // 3 hours at 50 users\n`;
          result += `    { duration: '2m', target: 0 },\n`;
          result += `  ],\n`;
        }

        result += `  thresholds: {\n`;
        result += `    http_req_duration: ['p(95)<500'],  // 95% of requests < 500ms\n`;
        result += `    http_req_failed: ['rate<0.01'],     // <1% error rate\n`;
        result += `  },\n`;
        result += `};\n\n`;

        result += `export default function() {\n`;
        result += `  const response = http.get('${input.target_url}');\n\n`;
        result += `  check(response, {\n`;
        result += `    'status is 200': (r) => r.status === 200,\n`;
        result += `    'response time < 500ms': (r) => r.timings.duration < 500,\n`;
        result += `  });\n\n`;
        result += `  sleep(1);\n`;
        result += `}\n`;
        result += `\`\`\`\n\n`;

        result += `**Run the test**:\n`;
        result += `\`\`\`bash\n`;
        result += `k6 run performance-test.js\n`;
        result += `\`\`\`\n\n`;
      }

      result += `--- Metrics to Monitor ---\n\n`;
      result += `1. **Response Time**: p50, p95, p99 percentiles\n`;
      result += `2. **Throughput**: Requests per second\n`;
      result += `3. **Error Rate**: Failed requests percentage\n`;
      result += `4. **Resource Usage**: CPU, memory, network\n`;
      result += `5. **Database Performance**: Query times, connections\n\n`;

      result += `--- Next Steps ---\n`;
      result += `1. Install ${tool}: npm install -g ${tool}\n`;
      result += `2. Save test script with write_file\n`;
      result += `3. Configure test parameters (users, duration)\n`;
      result += `4. Run test against staging/test environment\n`;
      result += `5. Analyze results and optimize bottlenecks\n`;

      return result;
    } catch (error) {
      throw new Error(`Failed to generate performance test: ${error}`);
    }
  },
};

export const prdTestingTools = [
  parsePRDDefinition,
  generateTestsFromPRDDefinition,
  generatePerformanceTestDefinition,
];
