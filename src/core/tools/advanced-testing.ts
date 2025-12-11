import {
  ToolDefinition,
  GenerateIntegrationTestInput,
  GenerateE2ETestInput,
  GenerateAPITestInput,
} from "../types.js";
import { colors } from "../../utils/colors.js";
import * as fs from "fs/promises";
import * as path from "path";

const generateIntegrationTestDefinition: ToolDefinition = {
  name: "generate_integration_test",
  description:
    "Generate integration tests that verify interactions between multiple components or modules. Analyzes component dependencies and creates tests with mocks/stubs.",
  parameters: {
    type: "object",
    properties: {
      components: {
        type: "array",
        items: { type: "string" },
        description: "List of component files to test integration between",
      },
      language: {
        type: "string",
        enum: ["python", "java", "javascript"],
        description: "Programming language",
      },
      test_scenario: {
        type: "string",
        description: "Description of the integration scenario to test",
      },
    },
    required: ["components", "language", "test_scenario"],
  },
  function: async (input: GenerateIntegrationTestInput) => {
    try {
      console.log(
        `\n${colors.cyan}Generating integration test for ${input.components.length} components...${colors.reset}\n`
      );

      let result = `Integration Test Generation\n`;
      result += `${"=".repeat(50)}\n\n`;
      result += `Scenario: ${input.test_scenario}\n`;
      result += `Language: ${input.language}\n`;
      result += `Components:\n`;
      input.components.forEach((comp, idx) => {
        result += `  ${idx + 1}. ${comp}\n`;
      });
      result += `\n`;

      result += `--- Integration Test Strategy ---\n\n`;
      result += `Integration tests verify that components work together correctly:\n`;
      result += `1. Test data flow between components\n`;
      result += `2. Verify interfaces and contracts\n`;
      result += `3. Test error propagation\n`;
      result += `4. Use real implementations when possible\n`;
      result += `5. Mock external dependencies only\n\n`;

      if (input.language === "python") {
        result += `--- Python Integration Test Structure ---\n\n`;
        result += `\`\`\`python\n`;
        result += `import pytest\n`;
        result += `from unittest.mock import Mock, patch\n`;
        input.components.forEach((comp) => {
          const moduleName = path.basename(comp, ".py");
          result += `from ${moduleName} import *\n`;
        });
        result += `\n`;
        result += `@pytest.mark.integration\n`;
        result += `class TestIntegration${input.test_scenario.replace(/\\s+/g, "")}:\n`;
        result += `    \"\"\"Integration test for: ${input.test_scenario}\"\"\"\n\n`;
        result += `    @pytest.fixture\n`;
        result += `    def setup_components(self):\n`;
        result += `        \"\"\"Set up all components for integration testing\"\"\"\n`;
        result += `        # TODO: Initialize all required components\n`;
        result += `        pass\n\n`;
        result += `    def test_integration_flow(self, setup_components):\n`;
        result += `        \"\"\"Test the complete integration flow\"\"\"\n`;
        result += `        # Arrange: Set up test data\n`;
        result += `        # TODO: Prepare test inputs\n\n`;
        result += `        # Act: Execute the integration scenario\n`;
        result += `        # TODO: Call components in sequence\n\n`;
        result += `        # Assert: Verify the integration worked\n`;
        result += `        # TODO: Add assertions\n`;
        result += `        pass\n\n`;
        result += `    def test_integration_error_handling(self, setup_components):\n`;
        result += `        \"\"\"Test error propagation across components\"\"\"\n`;
        result += `        # TODO: Test error scenarios\n`;
        result += `        pass\n`;
        result += `\`\`\`\n\n`;
      } else if (input.language === "java") {
        result += `--- Java Integration Test Structure ---\n\n`;
        result += `\`\`\`java\n`;
        result += `import org.junit.jupiter.api.*;\n`;
        result += `import org.mockito.*;\n`;
        result += `import static org.junit.jupiter.api.Assertions.*;\n`;
        result += `import static org.mockito.Mockito.*;\n\n`;
        result += `@Tag("integration")\n`;
        result += `class ${input.test_scenario.replace(/\\s+/g, "")}IntegrationTest {\n\n`;
        result += `    @BeforeEach\n`;
        result += `    void setUp() {\n`;
        result += `        // Initialize components for integration testing\n`;
        result += `        // TODO: Set up components\n`;
        result += `    }\n\n`;
        result += `    @Test\n`;
        result += `    @DisplayName("${input.test_scenario}")\n`;
        result += `    void testIntegrationFlow() {\n`;
        result += `        // Arrange: Prepare test data\n`;
        result += `        // TODO: Set up test inputs\n\n`;
        result += `        // Act: Execute integration scenario\n`;
        result += `        // TODO: Call components in sequence\n\n`;
        result += `        // Assert: Verify integration\n`;
        result += `        // TODO: Add assertions\n`;
        result += `    }\n\n`;
        result += `    @Test\n`;
        result += `    void testErrorPropagation() {\n`;
        result += `        // Test error handling across components\n`;
        result += `        // TODO: Implement error scenario\n`;
        result += `    }\n`;
        result += `}\n`;
        result += `\`\`\`\n\n`;
      } else if (input.language === "javascript") {
        result += `--- JavaScript Integration Test Structure ---\n\n`;
        result += `\`\`\`javascript\n`;
        result += `import { describe, it, expect, beforeEach } from 'vitest';\n`;
        input.components.forEach((comp) => {
          result += `import { } from './${comp}';\n`;
        });
        result += `\n`;
        result += `describe('Integration: ${input.test_scenario}', () => {\n`;
        result += `  beforeEach(() => {\n`;
        result += `    // Set up components\n`;
        result += `    // TODO: Initialize components\n`;
        result += `  });\n\n`;
        result += `  it('should complete integration flow', async () => {\n`;
        result += `    // Arrange\n`;
        result += `    // TODO: Set up test data\n\n`;
        result += `    // Act\n`;
        result += `    // TODO: Execute integration\n\n`;
        result += `    // Assert\n`;
        result += `    // TODO: Verify results\n`;
        result += `  });\n\n`;
        result += `  it('should handle errors correctly', async () => {\n`;
        result += `    // TODO: Test error scenarios\n`;
        result += `  });\n`;
        result += `});\n`;
        result += `\`\`\`\n\n`;
      }

      result += `--- Mocking Strategy ---\n\n`;
      result += `For integration tests:\n`;
      result += `- Mock ONLY external dependencies (APIs, databases, file system)\n`;
      result += `- Use REAL implementations for components being tested\n`;
      result += `- Create test doubles for slow or unreliable dependencies\n`;
      result += `- Use dependency injection to make mocking easier\n\n`;

      result += `--- Next Steps ---\n`;
      result += `1. Create the integration test file with write_file\n`;
      result += `2. Implement the test setup and teardown\n`;
      result += `3. Add specific test cases for the integration scenario\n`;
      result += `4. Run tests with: run_tests mode=integration\n`;

      return result;
    } catch (error) {
      throw new Error(`Failed to generate integration test: ${error}`);
    }
  },
};

const generateE2ETestDefinition: ToolDefinition = {
  name: "generate_e2e_test",
  description:
    "Generate end-to-end test scenarios that simulate real user journeys. Supports web applications with Playwright/Selenium patterns.",
  parameters: {
    type: "object",
    properties: {
      user_journey: {
        type: "string",
        description:
          "Description of the user journey to test (e.g., 'User logs in, adds item to cart, checks out')",
      },
      app_type: {
        type: "string",
        enum: ["web", "api", "cli"],
        description: "Type of application",
      },
      framework: {
        type: "string",
        enum: ["playwright", "selenium", "cypress", "puppeteer"],
        description: "E2E testing framework to use",
      },
    },
    required: ["user_journey", "app_type"],
  },
  function: async (input: GenerateE2ETestInput) => {
    try {
      console.log(
        `\n${colors.blue}Generating E2E test for user journey...${colors.reset}\n`
      );

      let result = `End-to-End Test Generation\n`;
      result += `${"=".repeat(50)}\n\n`;
      result += `User Journey: ${input.user_journey}\n`;
      result += `App Type: ${input.app_type}\n`;
      result += `Framework: ${input.framework || "playwright"}\n\n`;

      result += `--- E2E Test Strategy ---\n\n`;
      result += `E2E tests verify complete user workflows:\n`;
      result += `1. Test from user's perspective\n`;
      result += `2. Cover happy path and critical errors\n`;
      result += `3. Use real data when possible\n`;
      result += `4. Test in production-like environment\n`;
      result += `5. Keep tests independent and idempotent\n\n`;

      const framework = input.framework || "playwright";

      if (input.app_type === "web") {
        if (framework === "playwright") {
          result += `--- Playwright E2E Test ---\n\n`;
          result += `\`\`\`javascript\n`;
          result += `import { test, expect } from '@playwright/test';\n\n`;
          result += `test.describe('${input.user_journey}', () => {\n`;
          result += `  test('completes user journey successfully', async ({ page }) => {\n`;
          result += `    // Navigate to application\n`;
          result += `    await page.goto('http://localhost:3000');\n\n`;
          result += `    // TODO: Implement journey steps\n`;
          result += `    // Example:\n`;
          result += `    // await page.click('[data-testid="login-button"]');\n`;
          result += `    // await page.fill('[name="email"]', 'test@example.com');\n`;
          result += `    // await page.fill('[name="password"]', 'password123');\n`;
          result += `    // await page.click('[type="submit"]');\n`;
          result += `    // await expect(page).toHaveURL('/dashboard');\n\n`;
          result += `    // Verify final state\n`;
          result += `    // TODO: Add assertions\n`;
          result += `  });\n\n`;
          result += `  test('handles errors gracefully', async ({ page }) => {\n`;
          result += `    // TODO: Test error scenarios\n`;
          result += `  });\n`;
          result += `});\n`;
          result += `\`\`\`\n\n`;
        } else if (framework === "cypress") {
          result += `--- Cypress E2E Test ---\n\n`;
          result += `\`\`\`javascript\n`;
          result += `describe('${input.user_journey}', () => {\n`;
          result += `  beforeEach(() => {\n`;
          result += `    cy.visit('/');\n`;
          result += `  });\n\n`;
          result += `  it('completes user journey successfully', () => {\n`;
          result += `    // TODO: Implement journey steps\n`;
          result += `    // Example:\n`;
          result += `    // cy.get('[data-testid="login-button"]').click();\n`;
          result += `    // cy.get('[name="email"]').type('test@example.com');\n`;
          result += `    // cy.get('[name="password"]').type('password123');\n`;
          result += `    // cy.get('[type="submit"]').click();\n`;
          result += `    // cy.url().should('include', '/dashboard');\n`;
          result += `  });\n`;
          result += `});\n`;
          result += `\`\`\`\n\n`;
        }
      } else if (input.app_type === "api") {
        result += `--- API E2E Test ---\n\n`;
        result += `\`\`\`javascript\n`;
        result += `import { test, expect } from 'vitest';\n`;
        result += `import axios from 'axios';\n\n`;
        result += `describe('${input.user_journey}', () => {\n`;
        result += `  const baseURL = 'http://localhost:3000/api';\n\n`;
        result += `  it('completes API workflow', async () => {\n`;
        result += `    // Step 1: Create resource\n`;
        result += `    const createResponse = await axios.post(\`\${baseURL}/resource\`, {\n`;
        result += `      // TODO: Add request body\n`;
        result += `    });\n`;
        result += `    expect(createResponse.status).toBe(201);\n\n`;
        result += `    // Step 2: Retrieve resource\n`;
        result += `    const id = createResponse.data.id;\n`;
        result += `    const getResponse = await axios.get(\`\${baseURL}/resource/\${id}\`);\n`;
        result += `    expect(getResponse.status).toBe(200);\n\n`;
        result += `    // TODO: Add more workflow steps\n`;
        result += `  });\n`;
        result += `});\n`;
        result += `\`\`\`\n\n`;
      }

      result += `--- Best Practices ---\n\n`;
      result += `1. **Selectors**: Use data-testid attributes, not CSS classes\n`;
      result += `2. **Wait Strategy**: Use explicit waits, not sleep/timeouts\n`;
      result += `3. **Test Data**: Create fresh data for each test\n`;
      result += `4. **Cleanup**: Clean up after tests (delete test data)\n`;
      result += `5. **Screenshots**: Capture on failure for debugging\n`;
      result += `6. **Parallel Execution**: Make tests independent\n\n`;

      result += `--- Next Steps ---\n`;
      result += `1. Install ${framework}: npm install -D ${framework}\n`;
      result += `2. Create test file with write_file\n`;
      result += `3. Implement the journey steps\n`;
      result += `4. Add assertions for expected outcomes\n`;
      result += `5. Run with: npx ${framework} test\n`;

      return result;
    } catch (error) {
      throw new Error(`Failed to generate E2E test: ${error}`);
    }
  },
};

const generateAPITestDefinition: ToolDefinition = {
  name: "generate_api_test",
  description:
    "Generate comprehensive API test suites including endpoint testing, schema validation, and contract testing.",
  parameters: {
    type: "object",
    properties: {
      api_spec: {
        type: "string",
        description:
          "API specification (OpenAPI/Swagger file path or endpoint documentation)",
      },
      endpoints: {
        type: "array",
        items: { type: "string" },
        description: "List of API endpoints to test",
      },
      language: {
        type: "string",
        enum: ["javascript", "python", "java"],
        description: "Programming language for tests",
      },
    },
    required: ["endpoints", "language"],
  },
  function: async (input: GenerateAPITestInput) => {
    try {
      console.log(
        `\n${colors.green}Generating API tests for ${input.endpoints.length} endpoint(s)...${colors.reset}\n`
      );

      let result = `API Test Generation\n`;
      result += `${"=".repeat(50)}\n\n`;
      result += `Language: ${input.language}\n`;
      result += `Endpoints:\n`;
      input.endpoints.forEach((endpoint, idx) => {
        result += `  ${idx + 1}. ${endpoint}\n`;
      });
      result += `\n`;

      result += `--- API Testing Strategy ---\n\n`;
      result += `Comprehensive API tests should cover:\n`;
      result += `1. **Happy Path**: Valid requests return expected responses\n`;
      result += `2. **Validation**: Invalid inputs return proper errors\n`;
      result += `3. **Authentication**: Protected endpoints require auth\n`;
      result += `4. **Schema**: Response matches expected structure\n`;
      result += `5. **Status Codes**: Correct HTTP status codes\n`;
      result += `6. **Performance**: Response times within limits\n\n`;

      if (input.language === "javascript") {
        result += `--- JavaScript API Test Suite ---\n\n`;
        result += `\`\`\`javascript\n`;
        result += `import { describe, it, expect, beforeAll } from 'vitest';\n`;
        result += `import axios from 'axios';\n\n`;
        result += `const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';\n\n`;
        result += `describe('API Test Suite', () => {\n`;
        result += `  let authToken;\n\n`;
        result += `  beforeAll(async () => {\n`;
        result += `    // Set up authentication if needed\n`;
        result += `    // const response = await axios.post(\`\${API_BASE_URL}/auth/login\`, {...});\n`;
        result += `    // authToken = response.data.token;\n`;
        result += `  });\n\n`;

        input.endpoints.forEach((endpoint) => {
          const endpointName = endpoint.replace(/\/api\//, "").replace(/\//g, "_");
          result += `  describe('${endpoint}', () => {\n`;
          result += `    it('returns success with valid request', async () => {\n`;
          result += `      const response = await axios.get(\`\${API_BASE_URL}${endpoint}\`);\n`;
          result += `      expect(response.status).toBe(200);\n`;
          result += `      // TODO: Add schema validation\n`;
          result += `    });\n\n`;
          result += `    it('returns error with invalid request', async () => {\n`;
          result += `      // TODO: Test error cases\n`;
          result += `    });\n\n`;
          result += `    it('requires authentication', async () => {\n`;
          result += `      // TODO: Test without auth token\n`;
          result += `    });\n`;
          result += `  });\n\n`;
        });

        result += `});\n`;
        result += `\`\`\`\n\n`;
      } else if (input.language === "python") {
        result += `--- Python API Test Suite ---\n\n`;
        result += `\`\`\`python\n`;
        result += `import pytest\n`;
        result += `import requests\n`;
        result += `from jsonschema import validate\n\n`;
        result += `API_BASE_URL = "http://localhost:3000"\n\n`;
        result += `@pytest.fixture\n`;
        result += `def auth_headers():\n`;
        result += `    # TODO: Implement authentication\n`;
        result += `    return {}\n\n`;

        input.endpoints.forEach((endpoint) => {
          const endpointName = endpoint.replace(/\/api\//, "").replace(/\//g, "_");
          result += `class Test${endpointName.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("")}:\n`;
          result += `    def test_success_response(self, auth_headers):\n`;
          result += `        response = requests.get(f"{API_BASE_URL}${endpoint}", headers=auth_headers)\n`;
          result += `        assert response.status_code == 200\n`;
          result += `        # TODO: Validate response schema\n\n`;
          result += `    def test_error_handling(self, auth_headers):\n`;
          result += `        # TODO: Test error cases\n`;
          result += `        pass\n\n`;
        });

        result += `\`\`\`\n\n`;
      }

      result += `--- Schema Validation ---\n\n`;
      result += `Define JSON schemas for your API responses:\n\n`;
      result += `\`\`\`json\n`;
      result += `{\n`;
      result += `  "type": "object",\n`;
      result += `  "properties": {\n`;
      result += `    "id": { "type": "string" },\n`;
      result += `    "name": { "type": "string" },\n`;
      result += `    "email": { "type": "string", "format": "email" }\n`;
      result += `  },\n`;
      result += `  "required": ["id", "name", "email"]\n`;
      result += `}\n`;
      result += `\`\`\`\n\n`;

      result += `--- Next Steps ---\n`;
      result += `1. Create API test file with write_file\n`;
      result += `2. Implement authentication setup\n`;
      result += `3. Add schema definitions for each endpoint\n`;
      result += `4. Implement test cases for all scenarios\n`;
      result += `5. Run tests against API server\n`;

      return result;
    } catch (error) {
      throw new Error(`Failed to generate API tests: ${error}`);
    }
  },
};

export const advancedTestingTools = [
  generateIntegrationTestDefinition,
  generateE2ETestDefinition,
  generateAPITestDefinition,
];
