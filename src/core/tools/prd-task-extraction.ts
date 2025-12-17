import {
  ToolDefinition,
  ExtractTasksFromPRDInput,
  ExtractedTaskPlan,
  PRDRequirement,
  TodoItem,
} from "../types.js";
import { colors } from "../../utils/colors.js";
import * as fs from "fs/promises";
import * as path from "path";
import pdfParse from "pdf-parse";

const extractTasksFromPRDDefinition: ToolDefinition = {
  name: "extract_tasks_from_prd",
  description:
    "Extract actionable tasks from a PRD/PDF document. Analyzes requirements and converts them into structured implementation and test tasks with appropriate granularity.",
  parameters: {
    type: "object",
    properties: {
      prd_file: {
        type: "string",
        description: "Path to the PRD file (*.md, *.txt, *.pdf)",
      },
      granularity: {
        type: "string",
        enum: ["high-level", "detailed"],
        description: "Task granularity level (default: high-level)",
      },
    },
    required: ["prd_file"],
  },
  function: async (input: ExtractTasksFromPRDInput) => {
    try {
      console.log(
        `\n${colors.cyan}Extracting tasks from PRD: ${input.prd_file}...${colors.reset}\n`
      );

      const granularity = input.granularity || "high-level";
      const ext = path.extname(input.prd_file).toLowerCase();
      let prdContent = "";

      // Read and parse the PRD file
      if (ext === ".md" || ext === ".txt") {
        try {
          prdContent = await fs.readFile(input.prd_file, "utf-8");
        } catch (err) {
          throw new Error(`Could not read file: ${input.prd_file}`);
        }
      } else if (ext === ".pdf") {
        try {
          const buffer = await fs.readFile(input.prd_file);
          const pdfData = await pdfParse(buffer);
          prdContent = pdfData.text;
        } catch (err) {
          throw new Error(`Could not read PDF file: ${input.prd_file}. Error: ${err}`);
        }
      } else {
        throw new Error(`Unsupported file format: ${ext}. Use .md, .txt, or .pdf`);
      }

      // Extract requirements using multiple patterns
      const requirements: PRDRequirement[] = [];
      let reqIdCounter = 1;

      // Pattern 1: Markdown section headers
      const headerPattern = /^#{1,3}\s+(.+)$/gm;
      const headerMatches = prdContent.matchAll(headerPattern);
      for (const match of headerMatches) {
        const title = match[1].trim();
        // Filter out generic headers
        if (
          !title.toLowerCase().match(/^(introduction|overview|background|conclusion|appendix|table of contents|homework|assignment|evaluation|testing|what to submit)/)
        ) {
          requirements.push({
            id: `REQ-${String(reqIdCounter++).padStart(3, "0")}`,
            title,
            description: `Implement ${title}`,
            type: "feature",
            priority: "normal",
            requiresTest: true,
          });
        }
      }

      // Pattern 2: Plain text headers (title case standalone lines)
      const plainHeaderPattern = /^([A-Z][A-Za-z\s&]{3,50})$/gm;
      const plainHeaderMatches = prdContent.matchAll(plainHeaderPattern);
      for (const match of plainHeaderMatches) {
        const title = match[1].trim();
        if (
          !title.toLowerCase().match(/^(introduction|overview|background|conclusion|appendix|table of contents|homework|assignment|evaluation|testing|what to submit|the assignment|suggested approach)/) &&
          !requirements.some(r => r.title.toLowerCase() === title.toLowerCase())
        ) {
          requirements.push({
            id: `REQ-${String(reqIdCounter++).padStart(3, "0")}`,
            title,
            description: `Implement ${title}`,
            type: "feature",
            priority: "normal",
            requiresTest: true,
          });
        }
      }

      // Pattern 3: Java method signatures (handle missing spaces in PDF parsing)
      // Match patterns like: publicvoidinsertActor( or public void insertActor(
      const methodPattern = /public[A-Za-z<>[\],\s]*?([a-z][A-Za-z0-9]+)\s*\(/gm;
      const methodMatches = prdContent.matchAll(methodPattern);
      for (const match of methodMatches) {
        let methodName = match[1].trim();

        // Remove common prefixes that get concatenated (void, static, etc.)
        methodName = methodName.replace(/^(void|static|final|abstract|synchronized)/, '');

        // Extract actual method name if it starts with a lowercase letter after cleanup
        const actualMethod = methodName.match(/([a-z][A-Za-z0-9]+)/);
        if (actualMethod && actualMethod[1].length > 3 &&
            !actualMethod[1].match(/^(main|setUp|toString|equals|hashCode|void|static|class|interface)$/)) {
          const cleanName = actualMethod[1];
          if (!requirements.some(r => r.title.includes(cleanName))) {
            requirements.push({
              id: `REQ-${String(reqIdCounter++).padStart(3, "0")}`,
              title: `Implement ${cleanName} method`,
              description: `Implement the ${cleanName} method`,
              type: "feature",
              priority: "normal",
              requiresTest: true,
            });
          }
        }
      }

      // Pattern 4: Modal verbs (must, should, shall, will) - specific requirements
      const modalPattern = /(?:must|should|shall|will)\s+(.+?)(?:\.|$)/gi;
      const modalMatches = prdContent.matchAll(modalPattern);
      for (const match of modalMatches) {
        const requirement = match[1].trim();
        if (requirement.length > 10 && requirement.length < 200) {
          const priority = match[0].toLowerCase().startsWith("must") ? "high" : "normal";
          if (!requirements.some(r => r.title.toLowerCase() === requirement.toLowerCase())) {
            requirements.push({
              id: `REQ-${String(reqIdCounter++).padStart(3, "0")}`,
              title: requirement,
              description: requirement,
              type: "feature",
              priority,
              requiresTest: true,
            });
          }
        }
      }

      // Pattern 5: Action verbs (returns, inserts, given, etc.)
      const actionPattern = /(?:returns?|inserts?|given)\s+(.+?)(?:\.|$)/gi;
      const actionMatches = prdContent.matchAll(actionPattern);
      for (const match of actionMatches) {
        const requirement = match[0].trim();
        if (requirement.length > 15 && requirement.length < 200) {
          if (!requirements.some(r => r.title.toLowerCase() === requirement.toLowerCase())) {
            requirements.push({
              id: `REQ-${String(reqIdCounter++).padStart(3, "0")}`,
              title: requirement,
              description: requirement,
              type: "feature",
              priority: "normal",
              requiresTest: true,
            });
          }
        }
      }

      // Pattern 6: Numbered lists (1., 2., etc.)
      const numberedPattern = /^\d+\.\s+(.+)$/gm;
      const numberedMatches = prdContent.matchAll(numberedPattern);
      for (const match of numberedMatches) {
        const item = match[1].trim();
        if (item.length > 15 && item.length < 200) {
          if (!requirements.some(r => r.title.toLowerCase() === item.toLowerCase())) {
            requirements.push({
              id: `REQ-${String(reqIdCounter++).padStart(3, "0")}`,
              title: item,
              description: item,
              type: "feature",
              priority: "normal",
              requiresTest: true,
            });
          }
        }
      }

      // Pattern 7: User stories (As a... I want... So that...)
      const userStoryPattern = /As a (.+?),\s*I want (.+?)(?:,\s*so that (.+?))?(?:\.|$)/gi;
      const userStoryMatches = prdContent.matchAll(userStoryPattern);
      for (const match of userStoryMatches) {
        const role = match[1].trim();
        const goal = match[2].trim();
        const benefit = match[3]?.trim() || "";
        requirements.push({
          id: `REQ-${String(reqIdCounter++).padStart(3, "0")}`,
          title: `${role}: ${goal}`,
          description: benefit ? `As a ${role}, I want ${goal} so that ${benefit}` : `As a ${role}, I want ${goal}`,
          type: "feature",
          priority: "normal",
          requiresTest: true,
        });
      }

      // Deduplicate requirements based on similar titles
      const uniqueRequirements: PRDRequirement[] = [];
      for (const req of requirements) {
        const isDuplicate = uniqueRequirements.some(
          (existing) =>
            existing.title.toLowerCase() === req.title.toLowerCase() ||
            existing.title.toLowerCase().includes(req.title.toLowerCase()) ||
            req.title.toLowerCase().includes(existing.title.toLowerCase())
        );
        if (!isDuplicate) {
          uniqueRequirements.push(req);
        }
      }

      // If high-level granularity, group similar requirements
      let finalRequirements = uniqueRequirements;
      if (granularity === "high-level" && uniqueRequirements.length > 10) {
        // Group requirements by keyword similarity (simple grouping)
        const grouped: Map<string, PRDRequirement[]> = new Map();

        for (const req of uniqueRequirements) {
          const keywords = req.title.toLowerCase().split(/\s+/).filter(w => w.length > 4);
          let foundGroup = false;

          for (const [groupKey, groupReqs] of grouped.entries()) {
            const groupKeywords = groupKey.split(/\s+/);
            const commonKeywords = keywords.filter(k => groupKeywords.some(gk => gk.includes(k) || k.includes(gk)));

            if (commonKeywords.length > 0) {
              groupReqs.push(req);
              foundGroup = true;
              break;
            }
          }

          if (!foundGroup) {
            grouped.set(req.title, [req]);
          }
        }

        // Create high-level requirements from groups
        finalRequirements = Array.from(grouped.entries()).map(([title, reqs]) => ({
          id: reqs[0].id,
          title: reqs.length > 1 ? `Implement ${title.split(/\s+/).slice(0, 5).join(' ')} and related features` : reqs[0].title,
          description: reqs.map(r => r.description).join("; "),
          type: "feature" as const,
          priority: reqs.some(r => r.priority === "high") ? "high" as const : "normal" as const,
          requiresTest: true,
        }));
      }

      // Limit to reasonable number of tasks
      if (finalRequirements.length > 20) {
        finalRequirements = finalRequirements.slice(0, 20);
        console.log(`${colors.yellow}Note: Limited to 20 high-level tasks. Consider breaking PRD into phases.${colors.reset}\n`);
      }

      // Create TodoItem structures for implementation tasks
      const implementationTasks: TodoItem[] = finalRequirements.map((req, idx) => ({
        content: `[${req.priority.toUpperCase()}] ${req.title}`,
        activeForm: `Implementing ${req.title}`,
        status: "pending" as const,
      }));

      // Create TodoItem structures for test tasks
      const testTasks: TodoItem[] = finalRequirements
        .filter((req) => req.requiresTest)
        .map((req, idx) => ({
          content: `Generate and implement tests for: ${req.title}`,
          activeForm: `Generating tests for ${req.title}`,
          status: "pending" as const,
        }));

      const taskPlan: ExtractedTaskPlan = {
        sourceFile: input.prd_file,
        requirements: finalRequirements,
        implementationTasks,
        testTasks,
        totalCount: implementationTasks.length + testTasks.length,
      };

      // Format output
      let result = `Task Extraction Complete\n`;
      result += `${"=".repeat(60)}\n\n`;
      result += `Source: ${input.prd_file}\n`;
      result += `Granularity: ${granularity}\n`;
      result += `Total Requirements: ${finalRequirements.length}\n`;
      result += `Implementation Tasks: ${implementationTasks.length}\n`;
      result += `Test Tasks: ${testTasks.length}\n`;
      result += `Total Tasks: ${taskPlan.totalCount}\n\n`;

      result += `--- Implementation Tasks ---\n\n`;
      implementationTasks.forEach((task, idx) => {
        result += `${idx + 1}. ${task.content}\n`;
      });

      result += `\n--- Test Tasks ---\n\n`;
      testTasks.forEach((task, idx) => {
        result += `${implementationTasks.length + idx + 1}. ${task.content}\n`;
      });

      result += `\n--- Next Steps ---\n`;
      result += `Use the 'process_prd_with_tasks' tool to approve and execute these tasks.\n`;

      // Return as JSON for programmatic use
      return JSON.stringify(taskPlan, null, 2);
    } catch (error) {
      throw new Error(`Failed to extract tasks from PRD: ${error}`);
    }
  },
};

export const prdTaskExtractionTools = [extractTasksFromPRDDefinition];
