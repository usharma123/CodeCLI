import * as fs from "fs/promises";
import * as path from "path";
import { spawn } from "child_process";
import { confirmAction } from "./confirm.js";
import { colors } from "../utils/colors.js";
import { runShellCommand } from "./util-run.js";
let agentInstance = null;
export const setAgentInstance = (agent) => {
    agentInstance = agent;
};
// Tool Implementations
const readFileDefinition = {
    name: "read_file",
    description: "Read the contents of a given relative file path.",
    parameters: {
        type: "object",
        properties: {
            path: {
                type: "string",
                description: "The relative path of a file in the working directory",
            },
        },
        required: ["path"],
    },
    function: async (input) => {
        try {
            const content = await fs.readFile(input.path, "utf-8");
            // Limit response size to avoid issues
            if (content.length > 10000) {
                return (content.substring(0, 10000) + "\n... (truncated, file too large)");
            }
            return content;
        }
        catch (error) {
            throw new Error(`Failed to read file: ${error}`);
        }
    },
};
const listFilesDefinition = {
    name: "list_files",
    description: "List files and directories at a given path.",
    parameters: {
        type: "object",
        properties: {
            path: {
                type: "string",
                description: "Optional relative path to list files from.",
            },
        },
    },
    function: async (input) => {
        const dir = input.path || ".";
        try {
            const files = [];
            async function walk(currentPath, basePath, depth = 0) {
                // Limit depth to avoid too many files
                if (depth > 3)
                    return;
                const entries = await fs.readdir(currentPath, { withFileTypes: true });
                for (const entry of entries) {
                    // Skip node_modules and .git directories
                    if (entry.name === "node_modules" ||
                        entry.name === ".git" ||
                        entry.name.startsWith(".")) {
                        continue;
                    }
                    const fullPath = path.join(currentPath, entry.name);
                    const relativePath = path.relative(basePath, fullPath);
                    if (entry.isDirectory()) {
                        files.push(relativePath + "/");
                        if (depth < 3) {
                            await walk(fullPath, basePath, depth + 1);
                        }
                    }
                    else {
                        files.push(relativePath);
                    }
                }
            }
            await walk(dir, dir);
            return JSON.stringify(files);
        }
        catch (error) {
            throw new Error(`Failed to list files: ${error}`);
        }
    },
};
const writeFileDefinition = {
    name: "write_file",
    description: "Create a new file or completely overwrite an existing file with the provided content.",
    parameters: {
        type: "object",
        properties: {
            path: {
                type: "string",
                description: "The path where the file should be created",
            },
            content: {
                type: "string",
                description: "The complete content to write to the file",
            },
        },
        required: ["path", "content"],
    },
    function: async (input) => {
        if (!agentInstance) {
            throw new Error("Agent not initialized");
        }
        try {
            // Validate input eagerly so the model gets actionable feedback
            if (!input.path || typeof input.path !== "string") {
                throw new Error("write_file requires a string 'path' (relative or absolute).");
            }
            const hasContentProp = input && Object.prototype.hasOwnProperty.call(input, "content");
            if (!hasContentProp) {
                throw new Error("write_file is missing the required 'content' string. Please call with both 'path' and the full file contents, e.g. {\"path\":\"tests/python/test_agent.py\",\"content\":\"...\"}.");
            }
            if (typeof input.content !== "string") {
                throw new Error("write_file 'content' must be a string (can be empty).");
            }
            // Check if file exists
            let fileExists = true;
            let currentContent = "";
            try {
                currentContent = await fs.readFile(input.path, "utf-8");
            }
            catch (error) {
                if (error.code === "ENOENT") {
                    fileExists = false;
                }
                else {
                    throw error;
                }
            }
            // Show preview (Cursor-style)
            const lines = input.content.split("\n");
            const totalLines = lines.length;
            const previewCount = Math.min(15, totalLines);
            console.log(`  ${colors.gray}└ ${fileExists ? "Overwrite" : "Create"} ${colors.bold}${input.path}${colors.reset}${colors.gray} (${totalLines} lines)${colors.reset}`);
            // Show line-numbered preview
            for (let i = 0; i < previewCount; i++) {
                const lineNum = String(i + 1).padStart(4, " ");
                console.log(`    ${colors.gray}${lineNum}${colors.reset} ${colors.green}+${colors.reset} ${lines[i]}`);
            }
            if (totalLines > previewCount) {
                console.log(`    ${colors.gray}     ... (${totalLines - previewCount} more lines)${colors.reset}`);
            }
            // Ask for confirmation using Ink
            const confirmed = await confirmAction("Apply changes?");
            if (confirmed) {
                // Create directory if it doesn't exist
                const dir = path.dirname(input.path);
                if (dir !== ".") {
                    await fs.mkdir(dir, { recursive: true });
                }
                // Write the file
                await fs.writeFile(input.path, input.content, "utf-8");
                return `File ${input.path} ${fileExists ? "overwritten" : "created"} successfully`;
            }
            else {
                return "Operation cancelled by user";
            }
        }
        catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error(`Failed to write file: ${error}`);
        }
    },
};
const editFileDefinition = {
    name: "edit_file",
    description: "Edit a file by replacing specific text. Use this for partial file modifications.",
    parameters: {
        type: "object",
        properties: {
            path: {
                type: "string",
                description: "The path to the file",
            },
            old_str: {
                type: "string",
                description: "Text to search for and replace. Use empty string to append to file.",
            },
            new_str: {
                type: "string",
                description: "Text to replace old_str with",
            },
        },
        required: ["path", "old_str", "new_str"],
    },
    function: async (input) => {
        if (!input.path || input.old_str === input.new_str) {
            throw new Error("Invalid input parameters");
        }
        if (!agentInstance) {
            throw new Error("Agent not initialized");
        }
        try {
            let currentContent = "";
            let fileExists = true;
            try {
                currentContent = await fs.readFile(input.path, "utf-8");
            }
            catch (error) {
                if (error.code === "ENOENT") {
                    fileExists = false;
                    if (input.old_str !== "") {
                        throw new Error(`File ${input.path} does not exist. Use write_file to create new files.`);
                    }
                }
                else {
                    throw error;
                }
            }
            // Calculate new content
            let newContent;
            if (!fileExists) {
                newContent = input.new_str;
            }
            else {
                if (!currentContent.includes(input.old_str) && input.old_str !== "") {
                    throw new Error(`Text not found in file: "${input.old_str.substring(0, 50)}${input.old_str.length > 50 ? "..." : ""}"`);
                }
                newContent = currentContent.replace(input.old_str, input.new_str);
            }
            // Show preview (Cursor-style with line numbers)
            const oldLines = input.old_str.split("\n");
            const newLines = input.new_str.split("\n");
            const addCount = newLines.filter(l => l.trim()).length;
            const removeCount = oldLines.filter(l => l.trim()).length;
            // Find line number where the change starts
            const allLines = currentContent.split("\n");
            let startLineNum = 1;
            if (input.old_str) {
                const idx = currentContent.indexOf(input.old_str);
                if (idx >= 0) {
                    startLineNum = currentContent.substring(0, idx).split("\n").length;
                }
            }
            console.log(`  ${colors.gray}└ Updated ${colors.bold}${input.path}${colors.reset}${colors.gray} with ${colors.green}${addCount} addition${addCount !== 1 ? "s" : ""}${colors.gray} and ${colors.red}${removeCount} removal${removeCount !== 1 ? "s" : ""}${colors.reset}`);
            // Show the diff with line numbers
            const maxPreview = 8;
            let lineNum = startLineNum;
            // Show removals
            const oldPreview = oldLines.slice(0, maxPreview);
            for (const line of oldPreview) {
                const ln = String(lineNum).padStart(4, " ");
                console.log(`    ${colors.gray}${ln}${colors.reset} ${colors.red}-${colors.reset} ${colors.red}${line}${colors.reset}`);
            }
            if (oldLines.length > maxPreview) {
                console.log(`    ${colors.gray}     ... (${oldLines.length - maxPreview} more removals)${colors.reset}`);
            }
            // Show additions
            lineNum = startLineNum;
            const newPreview = newLines.slice(0, maxPreview);
            for (const line of newPreview) {
                const ln = String(lineNum).padStart(4, " ");
                console.log(`    ${colors.gray}${ln}${colors.reset} ${colors.green}+${colors.reset} ${colors.green}${line}${colors.reset}`);
                lineNum++;
            }
            if (newLines.length > maxPreview) {
                console.log(`    ${colors.gray}     ... (${newLines.length - maxPreview} more additions)${colors.reset}`);
            }
            // Ask for confirmation using Ink
            const confirmed = await confirmAction("Apply changes?");
            if (confirmed) {
                if (!fileExists) {
                    const dir = path.dirname(input.path);
                    if (dir !== ".") {
                        await fs.mkdir(dir, { recursive: true });
                    }
                }
                await fs.writeFile(input.path, newContent, "utf-8");
                return "File successfully updated";
            }
            else {
                return "Changes cancelled by user";
            }
        }
        catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error(`Failed to edit file: ${error}`);
        }
    },
};
const sanitizeName = (name) => {
    const safe = name
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");
    return safe || "app";
};
const getApiTemplate = (base, name) => {
    return [
        {
            path: `${base}/package.json`,
            content: JSON.stringify({
                name: sanitizeName(name || "api-server"),
                type: "module",
                scripts: {
                    dev: "bun --watch src/server.ts",
                    start: "bun src/server.ts",
                },
                dependencies: {
                    express: "^4.19.2",
                    dotenv: "^16.4.5",
                },
            }, null, 2),
        },
        {
            path: `${base}/tsconfig.json`,
            content: `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node"]
  }
}
`,
        },
        {
            path: `${base}/.env.example`,
            content: `PORT=3000
`,
        },
        {
            path: `${base}/src/server.ts`,
            content: `import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "${name || "api"}" });
});

app.get("/", (_req, res) => {
  res.json({
    message: "Hello from ${name || "API"}",
  });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(\`API listening on http://localhost:\${port}\`);
});
`,
        },
        {
            path: `${base}/README.md`,
            content: `# ${name || "API Server"}

## Run
1) Copy .env.example to .env and set PORT (optional)
2) bun install
3) bun run dev   # or bun run start

## Test
curl http://localhost:3000/health
`,
        },
    ];
};
const getChatbotTemplate = (base, name, model) => {
    const appName = name || "chatbot-api";
    const defaultModel = model || "anthropic/claude-3.5-sonnet";
    return [
        {
            path: `${base}/package.json`,
            content: JSON.stringify({
                name: sanitizeName(appName),
                type: "module",
                scripts: {
                    dev: "bun --watch src/server.ts",
                    start: "bun src/server.ts",
                },
                dependencies: {
                    express: "^4.19.2",
                    dotenv: "^16.4.5",
                    openai: "^4.57.2",
                },
            }, null, 2),
        },
        {
            path: `${base}/tsconfig.json`,
            content: `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node"]
  }
}
`,
        },
        {
            path: `${base}/.env.example`,
            content: `OPENROUTER_API_KEY=sk-or-v1-xxx
OPENROUTER_MODEL=${defaultModel}
PORT=3001
`,
        },
        {
            path: `${base}/src/server.ts`,
            content: `import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(express.json());

const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) {
  console.warn("OPENROUTER_API_KEY is not set. /chat will return 500.");
}

const client = new OpenAI({
  apiKey,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://github.com/yourusername/ai-coding-agent",
    "X-Title": "${appName}",
  },
});

const model = process.env.OPENROUTER_MODEL || "${defaultModel}";

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "${appName}", model });
});

app.post("/chat", async (req, res) => {
  if (!apiKey) {
    return res.status(500).json({ error: "OPENROUTER_API_KEY missing" });
  }

  const userMessage: string = req.body?.message;
  const history: { role: "user" | "assistant"; content: string }[] =
    req.body?.history || [];

  if (!userMessage) {
    return res.status(400).json({ error: "message is required" });
  }

  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: "You are a helpful chatbot API." },
        ...history,
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content || "";
    res.json({ reply });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Chat error:", msg);
    res.status(500).json({ error: msg });
  }
});

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  console.log(\`Chatbot API listening on http://localhost:\${port}\`);
});
`,
        },
        {
            path: `${base}/README.md`,
            content: `# ${appName}

## Run
1) Copy .env.example to .env and set OPENROUTER_API_KEY (and model/port if needed)
2) bun install
3) bun run dev   # or bun run start

## Test
curl -X POST http://localhost:3001/chat -H 'Content-Type: application/json' \\
  -d '{"message":"Hello"}'
`,
        },
    ];
};
const getStaticTemplate = (base, name) => [
    {
        path: `${base}/index.html`,
        content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${name || "Static Site"}</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <main class="page">
      <h1>${name || "Static Site"}</h1>
      <p>Your static site is ready. Edit <code>index.html</code> to get started.</p>
      <button id="cta">Click me</button>
      <pre id="log"></pre>
    </main>
    <script type="module">
      const log = document.getElementById("log");
      document.getElementById("cta")?.addEventListener("click", () => {
        log.textContent = "Hello from ${name || "static app"}!";
      });
    </script>
  </body>
</html>
`,
    },
    {
        path: `${base}/styles.css`,
        content: `:root {
  color-scheme: light dark;
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
body {
  margin: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: radial-gradient(circle at 20% 20%, #2d2f36, #0e0f12);
  color: #e8ecf1;
}
.page {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 24px;
  border-radius: 12px;
  width: min(720px, 90vw);
  box-shadow: 0 12px 80px rgba(0, 0, 0, 0.35);
}
button {
  background: #6c7bfd;
  border: none;
  color: white;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
pre {
  background: rgba(0, 0, 0, 0.35);
  padding: 12px;
  border-radius: 8px;
}
`,
    },
    {
        path: `${base}/README.md`,
        content: `# ${name || "Static Site"}

Open index.html in a browser or serve the folder with:

bunx serve .
`,
    },
];
const getReactTemplate = (base, name, includeApi) => {
    const files = [
        {
            path: `${base}/package.json`,
            content: JSON.stringify({
                name: sanitizeName(name || "react-app"),
                private: true,
                type: "module",
                scripts: {
                    dev: "bunx vite",
                    build: "bunx vite build",
                    preview: "bunx vite preview",
                },
                dependencies: {
                    react: "^18.3.1",
                    "react-dom": "^18.3.1",
                },
                devDependencies: {
                    typescript: "^5.6.3",
                    vite: "^5.4.8",
                    "@types/react": "^18.3.10",
                    "@types/react-dom": "^18.3.0",
                },
            }, null, 2),
        },
        {
            path: `${base}/tsconfig.json`,
            content: `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["vite/client"]
  }
}
`,
        },
        {
            path: `${base}/vite.config.ts`,
            content: `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
`,
        },
        {
            path: `${base}/index.html`,
            content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${name || "React App"}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
        },
        {
            path: `${base}/src/main.tsx`,
            content: `import React from "react";
      import ReactDOM from "react-dom/client";
      import App from "./App";
      import "./styles.css";

      ReactDOM.createRoot(document.getElementById("root")!).render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      );
      `,
        },
        {
            path: `${base}/src/App.tsx`,
            content: `import { useState } from "react";

export default function App() {
  const [messages, setMessages] = useState<string[]>([]);

  return (
    <main className="page">
      <header>
        <p className="badge">Vite + React (Bun)</p>
        <h1>${name || "React App"}</h1>
      </header>
      <section>
        <p>Edit <code>src/App.tsx</code> and save to reload.</p>
        <button
          onClick={() =>
            setMessages((prev) => [...prev, "Hello from your new app!"])
          }
        >
          Add message
        </button>
        <ul>
          {messages.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
`,
        },
        {
            path: `${base}/src/styles.css`,
            content: `:root {
  color-scheme: light dark;
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
body {
  margin: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: radial-gradient(circle at 20% 20%, #20212b, #0e0f12);
  color: #e8ecf1;
}
.page {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 24px;
  border-radius: 12px;
  width: min(720px, 90vw);
  box-shadow: 0 12px 80px rgba(0, 0, 0, 0.35);
}
.badge {
  display: inline-flex;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  font-size: 12px;
  letter-spacing: 0.02em;
}
button {
  background: #6c7bfd;
  border: none;
  color: white;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
ul {
  list-style: none;
  padding: 0;
}
li {
  padding: 6px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
`,
        },
        {
            path: `${base}/README.md`,
            content: `# ${name || "React App"}

## Run
bun install
bun run dev   # http://localhost:5173

## Build
bun run build
bun run preview
`,
        },
    ];
    if (includeApi) {
        files.push(...getApiTemplate(`${base}/api`, `${name || "api"}-api`).map((file) => ({
            ...file,
            // Avoid nested package name collisions
            path: file.path,
        })));
    }
    return files;
};
const buildTemplateFiles = (input) => {
    const template = input.template || "chatbot";
    const baseDir = input.target_dir?.trim() || sanitizeName(input.name || template);
    const name = input.name || template;
    switch (template) {
        case "api":
            return {
                baseDir,
                files: getApiTemplate(baseDir, name),
                description: "Bun + Express REST API",
            };
        case "chatbot":
            return {
                baseDir,
                files: getChatbotTemplate(baseDir, name, input.model),
                description: "Bun + Express chatbot API via OpenRouter",
            };
        case "static":
            return {
                baseDir,
                files: getStaticTemplate(baseDir, name),
                description: "Static HTML/CSS site",
            };
        case "react":
        default:
            return {
                baseDir,
                files: getReactTemplate(baseDir, name, input.include_api),
                description: input.include_api
                    ? "React/Vite frontend with optional API scaffold"
                    : "React/Vite frontend",
            };
    }
};
const scaffoldProjectDefinition = {
    name: "scaffold_project",
    description: "Scaffold a project using Bun. Supported templates: api, chatbot, static, react (include_api optional).",
    parameters: {
        type: "object",
        properties: {
            template: {
                type: "string",
                description: "Template type: api | chatbot | static | react",
            },
            name: {
                type: "string",
                description: "Project name (used for package name and titles)",
            },
            target_dir: {
                type: "string",
                description: "Directory to create (relative). Defaults to name.",
            },
            model: {
                type: "string",
                description: "Model identifier for chatbot template (e.g., anthropic/claude-3.5-sonnet)",
            },
            include_api: {
                type: "boolean",
                description: "For react template, also scaffold an API folder",
            },
        },
        required: ["template"],
    },
    function: async (input) => {
        const { baseDir, files, description } = buildTemplateFiles(input);
        console.log(`  ${colors.gray}└ ${description} -> ${colors.bold}${baseDir}${colors.reset}${colors.gray} (${files.length} files)${colors.reset}`);
        const confirmed = await confirmAction("Scaffold project?");
        if (!confirmed) {
            return "Scaffold cancelled by user";
        }
        for (const file of files) {
            const fullDir = path.dirname(file.path);
            await fs.mkdir(fullDir, { recursive: true });
            await fs.writeFile(file.path, file.content, "utf-8");
        }
        return `Scaffolded ${description} at ${baseDir} (${files.length} files).`;
    },
};
const patchFileDefinition = {
    name: "patch_file",
    description: "Apply a unified diff patch to a file. Use this to make complex multi-line changes. The patch should be in unified diff format.",
    parameters: {
        type: "object",
        properties: {
            path: {
                type: "string",
                description: "The path to the file to patch",
            },
            patch: {
                type: "string",
                description: "The unified diff patch to apply. Should start with @@ line numbers and contain - lines (remove) and + lines (add).",
            },
        },
        required: ["path", "patch"],
    },
    function: async (input) => {
        if (!input.path || !input.patch) {
            throw new Error("Invalid input parameters");
        }
        if (!agentInstance) {
            throw new Error("Agent not initialized");
        }
        try {
            // Read current file content
            let currentContent;
            try {
                currentContent = await fs.readFile(input.path, "utf-8");
            }
            catch (error) {
                if (error.code === "ENOENT") {
                    throw new Error(`File ${input.path} does not exist. Use write_file to create new files.`);
                }
                throw error;
            }
            // Parse and apply the patch
            const lines = currentContent.split("\n");
            const patchLines = input.patch.split("\n");
            // Find the @@ hunk header
            let hunkHeader = patchLines.find((line) => line.startsWith("@@"));
            if (!hunkHeader) {
                throw new Error("Invalid patch format: no @@ hunk header found. Patch should be in unified diff format.\n\n" +
                    "Example format:\n" +
                    "@@ -10,3 +10,4 @@\n" +
                    " unchanged line\n" +
                    "-removed line\n" +
                    "+added line\n\n" +
                    "Suggestion: For simple changes, use edit_file instead.");
            }
            // Extract line numbers from @@ -start,count +start,count @@
            // More flexible regex to handle various formats
            const match = hunkHeader.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
            if (!match) {
                console.log(`${colors.red}Failed to parse hunk header: "${hunkHeader}"${colors.reset}`);
                console.log(`${colors.yellow}This usually means the patch format is incomplete or incorrect.${colors.reset}`);
                console.log(`${colors.cyan}Suggestion: Use edit_file for simple string replacements instead.${colors.reset}\n`);
                throw new Error(`Invalid hunk header format.\n\n` +
                    `Expected format: "@@ -startLine,count +startLine,count @@"\n` +
                    `Got: "${hunkHeader}"\n\n` +
                    `Example of valid patch:\n` +
                    `@@ -5,3 +5,3 @@\n` +
                    ` function test() {\n` +
                    `-  console.log("old");\n` +
                    `+  console.log("new");\n` +
                    ` }\n\n` +
                    `Tip: For simple changes, use edit_file instead of patch_file.`);
            }
            const startLine = parseInt(match[1]) - 1; // Convert to 0-based index
            // Apply the patch
            const newLines = [...lines];
            let currentLine = startLine;
            let patchIndex = patchLines.findIndex((line) => line.startsWith("@@")) + 1;
            const removedLines = [];
            const addedLines = [];
            while (patchIndex < patchLines.length) {
                const patchLine = patchLines[patchIndex];
                if (patchLine.startsWith("-")) {
                    // Remove line
                    const lineContent = patchLine.substring(1);
                    removedLines.push(lineContent);
                    if (newLines[currentLine] === lineContent) {
                        newLines.splice(currentLine, 1);
                    }
                    else {
                        console.log(`${colors.yellow}⚠️  Warning: Line mismatch at ${currentLine + 1}${colors.reset}`);
                        console.log(`${colors.gray}Expected: "${lineContent}"${colors.reset}`);
                        console.log(`${colors.gray}Found: "${newLines[currentLine]}"${colors.reset}`);
                    }
                }
                else if (patchLine.startsWith("+")) {
                    // Add line
                    const lineContent = patchLine.substring(1);
                    addedLines.push(lineContent);
                    newLines.splice(currentLine, 0, lineContent);
                    currentLine++;
                }
                else if (patchLine.startsWith(" ")) {
                    // Context line (unchanged)
                    currentLine++;
                }
                else if (patchLine.startsWith("@@")) {
                    // New hunk
                    break;
                }
                patchIndex++;
            }
            const newContent = newLines.join("\n");
            // Show preview (Cursor-style)
            console.log(`  ${colors.gray}└ Patch ${colors.bold}${input.path}${colors.reset}${colors.gray} with ${colors.green}${addedLines.length} addition${addedLines.length !== 1 ? "s" : ""}${colors.gray} and ${colors.red}${removedLines.length} removal${removedLines.length !== 1 ? "s" : ""}${colors.reset}`);
            // Show removals with line numbers
            const maxPreview = 8;
            let lineNum = startLine + 1;
            removedLines.slice(0, maxPreview).forEach((line) => {
                const ln = String(lineNum).padStart(4, " ");
                console.log(`    ${colors.gray}${ln}${colors.reset} ${colors.red}-${colors.reset} ${colors.red}${line}${colors.reset}`);
            });
            if (removedLines.length > maxPreview) {
                console.log(`    ${colors.gray}     ... (${removedLines.length - maxPreview} more removals)${colors.reset}`);
            }
            // Show additions with line numbers
            lineNum = startLine + 1;
            addedLines.slice(0, maxPreview).forEach((line) => {
                const ln = String(lineNum).padStart(4, " ");
                console.log(`    ${colors.gray}${ln}${colors.reset} ${colors.green}+${colors.reset} ${colors.green}${line}${colors.reset}`);
                lineNum++;
            });
            if (addedLines.length > maxPreview) {
                console.log(`    ${colors.gray}     ... (${addedLines.length - maxPreview} more additions)${colors.reset}`);
            }
            // Ask for confirmation using Ink
            const confirmed = await confirmAction("Apply patch?");
            if (confirmed) {
                await fs.writeFile(input.path, newContent, "utf-8");
                return "Patch successfully applied to file";
            }
            else {
                return "Patch cancelled by user";
            }
        }
        catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error(`Failed to apply patch: ${error}`);
        }
    },
};
// runShellCommand moved to core/util-run.ts
// Helper to install Java via Homebrew
const installJavaWithHomebrew = async () => {
    console.log(`\n${colors.yellow}Java is not installed on this system.${colors.reset}`);
    console.log(`${colors.cyan}Would you like to install Java via Homebrew?${colors.reset}`);
    const confirmed = await confirmAction("Install Java?");
    if (!confirmed) {
        return { success: false };
    }
    console.log(`\n${colors.cyan}Installing OpenJDK via Homebrew...${colors.reset}\n`);
    // First check if Homebrew is installed
    const brewCheck = await runShellCommand("which brew", process.cwd(), 10000);
    if (brewCheck.exitCode !== 0) {
        console.log(`\n${colors.red}Homebrew is not installed.${colors.reset}`);
        console.log(`${colors.yellow}Install Homebrew first: https://brew.sh${colors.reset}\n`);
        return { success: false };
    }
    // Install OpenJDK
    console.log(`${colors.cyan}Running: brew install openjdk${colors.reset}\n`);
    const installResult = await runShellCommand("brew install openjdk", process.cwd(), 300000); // 5 min timeout
    if (installResult.exitCode !== 0) {
        console.log(`\n${colors.red}Failed to install Java.${colors.reset}\n`);
        return { success: false };
    }
    // Get the Homebrew prefix and construct JAVA_HOME
    const prefixResult = await runShellCommand("brew --prefix openjdk", process.cwd(), 10000);
    const brewPrefix = prefixResult.stdout.trim();
    const javaHome = `${brewPrefix}/libexec/openjdk.jdk/Contents/Home`;
    console.log(`\n${colors.green}Java installed successfully!${colors.reset}`);
    console.log(`${colors.gray}JAVA_HOME: ${javaHome}${colors.reset}\n`);
    // Create symlink for system-wide access (optional, may require sudo)
    console.log(`${colors.cyan}Creating symlink for system Java access...${colors.reset}\n`);
    const symlinkCmd = `sudo ln -sfn ${brewPrefix}/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk.jdk 2>/dev/null || true`;
    await runShellCommand(symlinkCmd, process.cwd(), 30000);
    return { success: true, javaHome };
};
// Track Java installation state for the session
let sessionJavaHome = undefined;
const runCommandDefinition = {
    name: "run_command",
    description: "Execute a shell command and return the output. Use this to run tests (pytest, npm test), linters, build commands, or other CLI tools. The command runs in a shell with the working directory defaulting to the project root.",
    parameters: {
        type: "object",
        properties: {
            command: {
                type: "string",
                description: "The shell command to execute (e.g., 'pytest tests/', 'npm test', 'python script.py')",
            },
            working_dir: {
                type: "string",
                description: "Optional working directory for the command. Defaults to current directory.",
            },
            timeout_seconds: {
                type: "number",
                description: "Optional timeout in seconds. Defaults to 60. Max 300 (5 minutes).",
            },
        },
        required: ["command"],
    },
    function: async (input) => {
        if (!input.command || typeof input.command !== "string") {
            throw new Error("Command must be a non-empty string");
        }
        if (!agentInstance) {
            throw new Error("Agent not initialized");
        }
        // Validate and set timeout (default 60s, max 300s)
        const timeoutSeconds = Math.min(Math.max(input.timeout_seconds || 60, 1), 300);
        const timeoutMs = timeoutSeconds * 1000;
        // Set working directory
        const workingDir = input.working_dir || process.cwd();
        // Show command preview (Cursor-style)
        console.log(`  ${colors.gray}└ Command: ${colors.white}${input.command}${colors.reset}`);
        if (input.working_dir) {
            console.log(`    ${colors.gray}cwd: ${workingDir}${colors.reset}`);
        }
        // Ask for confirmation using Ink
        const confirmed = await confirmAction("Run command?");
        if (!confirmed) {
            return "Command cancelled by user";
        }
        console.log();
        // Build environment with Java if we've installed it this session
        const commandEnv = { ...process.env };
        if (sessionJavaHome) {
            commandEnv.JAVA_HOME = sessionJavaHome;
            commandEnv.PATH = `${sessionJavaHome}/bin:${process.env.PATH}`;
        }
        // Run the command
        const { stdout, stderr, exitCode, timedOut } = await runShellCommand(input.command, workingDir, timeoutMs, commandEnv);
        // Check for Java not installed error
        const combinedOutput = stdout + stderr;
        const javaNotInstalled = combinedOutput.includes("Unable to locate a Java Runtime") ||
            combinedOutput.includes("No Java runtime present");
        if (javaNotInstalled && !sessionJavaHome) {
            // Offer to install Java
            const installResult = await installJavaWithHomebrew();
            if (installResult.success && installResult.javaHome) {
                sessionJavaHome = installResult.javaHome;
                // Ask if user wants to retry the command
                const retryConfirmed = await confirmAction("Retry the original command with Java?");
                if (retryConfirmed) {
                    console.log(`\n${colors.cyan}Retrying command with Java...${colors.reset}\n`);
                    // Build new environment with Java
                    const javaEnv = { ...process.env };
                    javaEnv.JAVA_HOME = sessionJavaHome;
                    javaEnv.PATH = `${sessionJavaHome}/bin:${process.env.PATH}`;
                    // Retry the command
                    const retryResult = await runShellCommand(input.command, workingDir, timeoutMs, javaEnv);
                    console.log("\n");
                    if (retryResult.timedOut) {
                        console.log(`  ${colors.gray}└ ${colors.yellow}Timed out after ${timeoutSeconds}s${colors.reset}\n`);
                    }
                    else if (retryResult.exitCode === 0) {
                        console.log(`  ${colors.gray}└ ${colors.green}Exit code ${retryResult.exitCode}${colors.reset}\n`);
                    }
                    else {
                        console.log(`  ${colors.gray}└ ${colors.red}Failed with exit code ${retryResult.exitCode}${colors.reset}\n`);
                    }
                    // Build result string
                    let result = `Command: ${input.command}\n`;
                    result += `Exit code: ${retryResult.exitCode}\n`;
                    result += `Status: ${retryResult.timedOut ? "TIMEOUT" : retryResult.exitCode === 0 ? "SUCCESS" : "FAILED"}\n`;
                    result += `Note: Java was installed via Homebrew (JAVA_HOME=${sessionJavaHome})\n`;
                    if (retryResult.stdout.trim()) {
                        const maxLength = 8000;
                        const truncatedStdout = retryResult.stdout.length > maxLength
                            ? retryResult.stdout.substring(0, maxLength) + "\n... (output truncated)"
                            : retryResult.stdout;
                        result += `\n--- STDOUT ---\n${truncatedStdout}`;
                    }
                    if (retryResult.stderr.trim()) {
                        const maxLength = 4000;
                        const truncatedStderr = retryResult.stderr.length > maxLength
                            ? retryResult.stderr.substring(0, maxLength) + "\n... (stderr truncated)"
                            : retryResult.stderr;
                        result += `\n--- STDERR ---\n${truncatedStderr}`;
                    }
                    return result;
                }
            }
        }
        const success = exitCode === 0;
        console.log("\n");
        if (timedOut) {
            console.log(`  ${colors.gray}└ ${colors.yellow}Timed out after ${timeoutSeconds}s${colors.reset}\n`);
        }
        else if (success) {
            console.log(`  ${colors.gray}└ ${colors.green}Exit code ${exitCode}${colors.reset}\n`);
        }
        else {
            console.log(`  ${colors.gray}└ ${colors.red}Failed with exit code ${exitCode}${colors.reset}\n`);
        }
        // Build result string for the model
        let result = `Command: ${input.command}\n`;
        result += `Exit code: ${exitCode}\n`;
        result += `Status: ${timedOut ? "TIMEOUT" : success ? "SUCCESS" : "FAILED"}\n`;
        if (stdout.trim()) {
            // Limit output size to avoid token issues
            const maxLength = 8000;
            const truncatedStdout = stdout.length > maxLength
                ? stdout.substring(0, maxLength) + "\n... (output truncated)"
                : stdout;
            result += `\n--- STDOUT ---\n${truncatedStdout}`;
        }
        if (stderr.trim()) {
            const maxLength = 4000;
            const truncatedStderr = stderr.length > maxLength
                ? stderr.substring(0, maxLength) + "\n... (stderr truncated)"
                : stderr;
            result += `\n--- STDERR ---\n${truncatedStderr}`;
        }
        if (!stdout.trim() && !stderr.trim()) {
            result += "\n(No output)";
        }
        return result;
    },
};
const runTestsDefinition = {
    name: "run_tests",
    description: "Run tests for Python and/or Java projects with structured output parsing. Supports smoke, sanity, and full test modes. Returns test results with pass/fail counts and detailed failure information.",
    parameters: {
        type: "object",
        properties: {
            language: {
                type: "string",
                enum: ["python", "java", "all"],
                description: "Language to test: python, java, or all (default: all)",
            },
            mode: {
                type: "string",
                enum: ["smoke", "sanity", "full"],
                description: "Test mode: smoke (fast critical tests), sanity (targeted tests), full (all tests) (default: full)",
            },
            coverage: {
                type: "boolean",
                description: "Generate coverage reports (default: false)",
            },
        },
    },
    function: async (input) => {
        try {
            const language = input.language || "all";
            const mode = input.mode || "full";
            const coverage = input.coverage || false;
            console.log(`\n${colors.blue}Running ${mode} tests for ${language}...${colors.reset}`);
            // Build command
            let command = `bash scripts/test-runner.sh --mode ${mode} --language ${language}`;
            if (coverage) {
                command += " --coverage";
            }
            // Execute test runner with timeout to avoid hanging (e.g., network waits)
            const result = await new Promise((resolve, reject) => {
                const proc = spawn("bash", ["-c", command], {
                    cwd: process.cwd(),
                    shell: true,
                });
                let stdout = "";
                let stderr = "";
                let timedOut = false;
                // Kill the test process if it hangs too long (3 minutes)
                const timeoutMs = 180000;
                const timer = setTimeout(() => {
                    timedOut = true;
                    proc.kill("SIGKILL");
                }, timeoutMs);
                proc.stdout.on("data", (data) => {
                    const output = data.toString();
                    stdout += output;
                    process.stdout.write(output);
                });
                proc.stderr.on("data", (data) => {
                    const output = data.toString();
                    stderr += output;
                    process.stderr.write(output);
                });
                proc.on("close", (exitCode) => {
                    clearTimeout(timer);
                    let result = `Test Execution Results\n`;
                    result += `======================\n\n`;
                    result += `Mode: ${mode}\n`;
                    result += `Language: ${language}\n`;
                    result += `Coverage: ${coverage ? "enabled" : "disabled"}\n`;
                    result += `Exit Code: ${exitCode}\n`;
                    if (timedOut) {
                        result += `Status: TIMEOUT\n\n`;
                        result += `The test process exceeded ${timeoutMs / 1000}s and was terminated.\n`;
                        result += `If this was during dependency install (pip/mvn), rerun with network or preinstall deps:\n`;
                        result += `  python: pip install -r tests/python/requirements-test.txt\n`;
                        result += `  java: mvn -f tests/java/pom.xml test\n\n`;
                        resolve(result);
                        return;
                    }
                    result += `Status: ${exitCode === 0 ? "PASSED" : "FAILED"}\n\n`;
                    if (stdout.trim()) {
                        result += `--- OUTPUT ---\n${stdout}`;
                    }
                    if (stderr.trim()) {
                        result += `\n--- ERRORS ---\n${stderr}`;
                    }
                    // Parse results from output
                    const totalMatch = stdout.match(/Total Tests:\s+(\d+)/);
                    const passedMatch = stdout.match(/Passed:\s+(\d+)/);
                    const failedMatch = stdout.match(/Failed:\s+(\d+)/);
                    if (totalMatch && passedMatch && failedMatch) {
                        result += `\n\n--- SUMMARY ---\n`;
                        result += `Total:  ${totalMatch[1]}\n`;
                        result += `Passed: ${passedMatch[1]}\n`;
                        result += `Failed: ${failedMatch[1]}\n`;
                    }
                    // Check for Python test report
                    if ((language === "python" || language === "all") &&
                        require("fs").existsSync("tests/python/test-report.json")) {
                        try {
                            const reportData = require("fs").readFileSync("tests/python/test-report.json", "utf-8");
                            const report = JSON.parse(reportData);
                            if (report.tests && report.tests.length > 0) {
                                result += `\n--- PYTHON TEST DETAILS ---\n`;
                                report.tests.forEach((test) => {
                                    if (test.outcome === "failed") {
                                        result += `\n❌ ${test.nodeid}\n`;
                                        if (test.call && test.call.longrepr) {
                                            result += `   Error: ${test.call.longrepr}\n`;
                                        }
                                    }
                                });
                            }
                        }
                        catch (e) {
                            // Ignore JSON parsing errors
                        }
                    }
                    // Check for Java test reports
                    if (language === "java" || language === "all") {
                        const surefire = "tests/java/target/surefire-reports";
                        if (require("fs").existsSync(surefire)) {
                            result += `\n--- JAVA TEST REPORTS ---\n`;
                            result += `Reports location: ${surefire}\n`;
                        }
                    }
                    resolve(result);
                });
                proc.on("error", (error) => {
                    reject(new Error(`Failed to run tests: ${error.message}`));
                });
            });
            return result;
        }
        catch (error) {
            throw new Error(`Failed to run tests: ${error}`);
        }
    },
};
const analyzeTestFailuresDefinition = {
    name: "analyze_test_failures",
    description: "AI-powered analysis of test failures. Parses stack traces, identifies root causes, and suggests specific fixes. Use this after run_tests when failures occur.",
    parameters: {
        type: "object",
        properties: {
            test_output: {
                type: "string",
                description: "The test output containing failures and stack traces from run_tests",
            },
            language: {
                type: "string",
                enum: ["python", "java"],
                description: "Programming language of the tests",
            },
        },
        required: ["test_output", "language"],
    },
    function: async (input) => {
        try {
            console.log(`\n${colors.yellow}Analyzing ${input.language} test failures...${colors.reset}\n`);
            // Extract failure information
            const failures = [];
            if (input.language === "python") {
                // Parse Python pytest failures
                const failurePattern = /FAILED (.*?) - (.*?)(?:\n|$)/g;
                let match;
                while ((match = failurePattern.exec(input.test_output)) !== null) {
                    failures.push({
                        test: match[1],
                        error: match[2],
                    });
                }
                // Extract stack traces
                const stackPattern = /(.*?):\d+: (.*?)$/gm;
                let stackMatch;
                while ((stackMatch = stackPattern.exec(input.test_output)) !== null) {
                    if (failures.length > 0) {
                        failures[failures.length - 1].location = stackMatch[1];
                    }
                }
            }
            else if (input.language === "java") {
                // Parse Java JUnit failures
                const failurePattern = /(?:FAILED|ERROR) (.*?)\((.*?)\)/g;
                let match;
                while ((match = failurePattern.exec(input.test_output)) !== null) {
                    failures.push({
                        test: `${match[2]}.${match[1]}`,
                        error: "See stack trace below",
                    });
                }
            }
            let analysis = `Test Failure Analysis (${input.language})\n`;
            analysis += `${"=".repeat(50)}\n\n`;
            analysis += `Found ${failures.length} test failure(s)\n\n`;
            for (let i = 0; i < failures.length; i++) {
                const failure = failures[i];
                analysis += `${i + 1}. ${failure.test}\n`;
                analysis += `   Error: ${failure.error}\n`;
                if (failure.location) {
                    analysis += `   Location: ${failure.location}\n`;
                }
                analysis += `\n`;
            }
            analysis += `\nRecommended Actions:\n`;
            analysis += `1. Read the failing test files to understand expectations\n`;
            analysis += `2. Read the implementation files at failure locations\n`;
            analysis += `3. Identify the root cause (logic error, missing feature, incorrect assertion)\n`;
            analysis += `4. Apply fixes using edit_file tool\n`;
            analysis += `5. Rerun tests with run_tests to verify fixes\n\n`;
            analysis += `Detailed Output:\n`;
            analysis += `${"-".repeat(50)}\n`;
            analysis += input.test_output;
            return analysis;
        }
        catch (error) {
            throw new Error(`Failed to analyze test failures: ${error}`);
        }
    },
};
const getCoverageDefinition = {
    name: "get_coverage",
    description: "Get code coverage analysis for Python or Java tests. Returns coverage percentages, uncovered lines, and suggestions for additional tests.",
    parameters: {
        type: "object",
        properties: {
            language: {
                type: "string",
                enum: ["python", "java"],
                description: "Programming language to analyze coverage for",
            },
        },
        required: ["language"],
    },
    function: async (input) => {
        try {
            console.log(`\n${colors.blue}Getting ${input.language} coverage...${colors.reset}\n`);
            let result = `Coverage Analysis (${input.language})\n`;
            result += `${"=".repeat(50)}\n\n`;
            if (input.language === "python") {
                // Check if coverage report exists
                const coverageFile = "tests/python/.coverage";
                const htmlReport = "tests/python/htmlcov/index.html";
                if (!require("fs").existsSync(coverageFile)) {
                    return (result +
                        "No coverage data found. Run tests with coverage:\n" +
                        "  run_tests with coverage=true\n");
                }
                // Run coverage report command
                const proc = spawn("bash", [
                    "-c",
                    "cd tests/python && python3 -m coverage report",
                ]);
                let stdout = "";
                let stderr = "";
                proc.stdout.on("data", (data) => {
                    stdout += data.toString();
                });
                proc.stderr.on("data", (data) => {
                    stderr += data.toString();
                });
                await new Promise((resolve) => proc.on("close", () => resolve(undefined)));
                result += `Coverage Report:\n${stdout}\n`;
                if (require("fs").existsSync(htmlReport)) {
                    result += `\nDetailed HTML report: ${htmlReport}\n`;
                }
            }
            else if (input.language === "java") {
                // Check for JaCoCo report
                const jacocoReport = "tests/java/target/site/jacoco/index.html";
                const jacocoXml = "tests/java/target/site/jacoco/jacoco.xml";
                if (!require("fs").existsSync(jacocoXml)) {
                    return (result +
                        "No coverage data found. Run tests with coverage:\n" +
                        "  run_tests with coverage=true\n");
                }
                result += `JaCoCo coverage report generated\n`;
                result += `HTML report: ${jacocoReport}\n`;
                result += `XML report: ${jacocoXml}\n\n`;
                // Parse XML for summary (basic)
                try {
                    const xmlData = require("fs").readFileSync(jacocoXml, "utf-8");
                    const instructionMatch = xmlData.match(/<counter type="INSTRUCTION" missed="(\d+)" covered="(\d+)"/);
                    const branchMatch = xmlData.match(/<counter type="BRANCH" missed="(\d+)" covered="(\d+)"/);
                    const lineMatch = xmlData.match(/<counter type="LINE" missed="(\d+)" covered="(\d+)"/);
                    if (instructionMatch) {
                        const missed = parseInt(instructionMatch[1]);
                        const covered = parseInt(instructionMatch[2]);
                        const total = missed + covered;
                        const percent = ((covered / total) * 100).toFixed(2);
                        result += `Instruction Coverage: ${percent}% (${covered}/${total})\n`;
                    }
                    if (lineMatch) {
                        const missed = parseInt(lineMatch[1]);
                        const covered = parseInt(lineMatch[2]);
                        const total = missed + covered;
                        const percent = ((covered / total) * 100).toFixed(2);
                        result += `Line Coverage: ${percent}% (${covered}/${total})\n`;
                    }
                    if (branchMatch) {
                        const missed = parseInt(branchMatch[1]);
                        const covered = parseInt(branchMatch[2]);
                        const total = missed + covered;
                        const percent = ((covered / total) * 100).toFixed(2);
                        result += `Branch Coverage: ${percent}% (${covered}/${total})\n`;
                    }
                }
                catch (e) {
                    result += "Could not parse coverage XML\n";
                }
            }
            result += `\nNext Steps:\n`;
            result += `1. Review uncovered lines in the reports\n`;
            result += `2. Write additional tests for uncovered code paths\n`;
            result += `3. Focus on edge cases and error handling\n`;
            return result;
        }
        catch (error) {
            throw new Error(`Failed to get coverage: ${error}`);
        }
    },
};
const detectChangedFilesDefinition = {
    name: "detect_changed_files",
    description: "Detect files that have changed since a given commit or time period. Uses git to identify modified Python or Java files. Useful for running only affected tests.",
    parameters: {
        type: "object",
        properties: {
            since: {
                type: "string",
                description: "Git reference to compare against (e.g., 'HEAD~1', 'main', '1 day ago'). Default: HEAD",
            },
            language: {
                type: "string",
                enum: ["python", "java", "all"],
                description: "Filter by language (default: all)",
            },
        },
    },
    function: async (input) => {
        try {
            const since = input.since || "HEAD";
            const language = input.language || "all";
            console.log(`\n${colors.blue}Detecting changed files since ${since}...${colors.reset}\n`);
            // Get changed files from git
            const gitCommand = `git diff --name-only ${since}`;
            const proc = spawn("bash", ["-c", gitCommand]);
            let stdout = "";
            let stderr = "";
            proc.stdout.on("data", (data) => {
                stdout += data.toString();
            });
            proc.stderr.on("data", (data) => {
                stderr += data.toString();
            });
            await new Promise((resolve) => proc.on("close", () => resolve(undefined)));
            if (stderr) {
                throw new Error(`Git error: ${stderr}`);
            }
            const allFiles = stdout
                .split("\n")
                .filter((f) => f.trim())
                .map((f) => f.trim());
            // Filter by language
            let filteredFiles = allFiles;
            if (language === "python") {
                filteredFiles = allFiles.filter((f) => f.endsWith(".py"));
            }
            else if (language === "java") {
                filteredFiles = allFiles.filter((f) => f.endsWith(".java"));
            }
            else {
                filteredFiles = allFiles.filter((f) => f.endsWith(".py") || f.endsWith(".java"));
            }
            let result = `Changed Files Analysis\n`;
            result += `${"=".repeat(50)}\n\n`;
            result += `Since: ${since}\n`;
            result += `Language Filter: ${language}\n`;
            result += `Total Changed: ${allFiles.length} files\n`;
            result += `Filtered: ${filteredFiles.length} files\n\n`;
            if (filteredFiles.length === 0) {
                result += "No changed files found.\n";
                return result;
            }
            result += `Changed Files:\n`;
            filteredFiles.forEach((file, idx) => {
                result += `${idx + 1}. ${file}\n`;
            });
            // Map to test files
            result += `\n--- Potentially Affected Tests ---\n`;
            const testFiles = new Set();
            filteredFiles.forEach((file) => {
                if (file.endsWith(".py") && !file.includes("test_")) {
                    // For Python, look for test_*.py
                    const dir = require("path").dirname(file);
                    const basename = require("path").basename(file, ".py");
                    testFiles.add(`${dir}/test_${basename}.py`);
                }
                else if (file.endsWith(".java") && !file.includes("Test.java")) {
                    // For Java, look for *Test.java
                    const withoutExt = file.replace(".java", "");
                    testFiles.add(`${withoutExt}Test.java`);
                }
            });
            if (testFiles.size > 0) {
                result += `Suggested test files to run:\n`;
                Array.from(testFiles).forEach((test, idx) => {
                    result += `${idx + 1}. ${test}\n`;
                });
            }
            else {
                result += "No obvious test file mappings found.\n";
            }
            result += `\nRecommended Action:\n`;
            result += `Run tests for these files to verify changes:\n`;
            result += `  run_tests with appropriate filters\n`;
            return result;
        }
        catch (error) {
            throw new Error(`Failed to detect changed files: ${error}`);
        }
    },
};
const generateTestsDefinition = {
    name: "generate_tests",
    description: "AI-powered test generation for a given file. Analyzes the code, identifies functions/methods without tests, and generates comprehensive test cases including edge cases.",
    parameters: {
        type: "object",
        properties: {
            file_path: {
                type: "string",
                description: "Path to the source file to generate tests for",
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
            // Read the source file
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
            // Analyze the code structure
            if (input.language === "python") {
                result += `--- Python Code Analysis ---\n\n`;
                // Extract function definitions
                const functionPattern = /def\s+(\w+)\s*\([^)]*\):/g;
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
                    result += `    """Tests for ${fn} function"""\n\n`;
                    result += `    def test_${fn}_happy_path(self):\n`;
                    result += `        """Test ${fn} with valid inputs"""\n`;
                    result += `        # TODO: Implement test\n`;
                    result += `        pass\n\n`;
                    result += `    def test_${fn}_edge_cases(self):\n`;
                    result += `        """Test ${fn} with edge cases"""\n`;
                    result += `        # TODO: Test empty, None, zero\n`;
                    result += `        pass\n\n`;
                    result += `    def test_${fn}_error_handling(self):\n`;
                    result += `        """Test ${fn} error handling"""\n`;
                    result += `        # TODO: Test invalid inputs\n`;
                    result += `        pass\n\n`;
                });
                result += `\`\`\`\n\n`;
            }
            else if (input.language === "java") {
                result += `--- Java Code Analysis ---\n\n`;
                // Extract class and method definitions
                const classPattern = /class\s+(\w+)/g;
                const methodPattern = /(?:public|private|protected)\s+\w+\s+(\w+)\s*\([^)]*\)/g;
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
                result += `\n--- Test Generation Strategy ---\n\n`;
                result += `For each method, generate tests for:\n`;
                result += `1. Happy path with valid inputs\n`;
                result += `2. Edge cases (null, empty, boundary values)\n`;
                result += `3. Exception handling\n`;
                result += `4. State verification\n\n`;
                result += `--- Suggested Test File ---\n\n`;
                const className = classes[0] || "Unknown";
                const testFileName = input.file_path.replace(".java", "Test.java");
                result += `File: ${testFileName}\n\n`;
                result += `Structure:\n`;
                result += `\`\`\`java\n`;
                result += `import org.junit.jupiter.api.Test;\n`;
                result += `import org.junit.jupiter.api.BeforeEach;\n`;
                result += `import static org.junit.jupiter.api.Assertions.*;\n\n`;
                result += `public class ${className}Test {\n\n`;
                result += `    private ${className} instance;\n\n`;
                result += `    @BeforeEach\n`;
                result += `    public void setUp() {\n`;
                result += `        instance = new ${className}();\n`;
                result += `    }\n\n`;
                methods.forEach((method) => {
                    result += `    @Test\n`;
                    result += `    public void test${method.charAt(0).toUpperCase() + method.slice(1)}HappyPath() {\n`;
                    result += `        // TODO: Implement test\n`;
                    result += `    }\n\n`;
                    result += `    @Test\n`;
                    result += `    public void test${method.charAt(0).toUpperCase() + method.slice(1)}EdgeCases() {\n`;
                    result += `        // TODO: Test null, empty, boundary values\n`;
                    result += `    }\n\n`;
                });
                result += `}\n`;
                result += `\`\`\`\n\n`;
            }
            result += `\n--- Next Steps ---\n`;
            result += `1. Review the suggested test structure\n`;
            result += `2. Use write_file to create the test file\n`;
            result += `3. Fill in test implementations based on the code logic\n`;
            result += `4. Run the tests with run_tests\n`;
            result += `5. Check coverage with get_coverage\n`;
            return result;
        }
        catch (error) {
            throw new Error(`Failed to generate tests: ${error}`);
        }
    },
};
const analyzeCoverageGapsDefinition = {
    name: "analyze_coverage_gaps",
    description: "Analyze code coverage to identify critical gaps. Highlights uncovered functions, branches, and lines. Prioritizes gaps by importance (public APIs, complex logic, error handling).",
    parameters: {
        type: "object",
        properties: {
            language: {
                type: "string",
                enum: ["python", "java"],
                description: "Programming language to analyze",
            },
            min_coverage: {
                type: "number",
                description: "Minimum acceptable coverage percentage (default: 80). Files below this are flagged.",
            },
        },
        required: ["language"],
    },
    function: async (input) => {
        try {
            const minCoverage = input.min_coverage || 80;
            console.log(`\n${colors.yellow}Analyzing coverage gaps for ${input.language}...${colors.reset}\n`);
            let result = `Coverage Gap Analysis\n`;
            result += `${"=".repeat(50)}\n\n`;
            result += `Language: ${input.language}\n`;
            result += `Minimum Threshold: ${minCoverage}%\n\n`;
            if (input.language === "python") {
                // Check for coverage data
                const coverageFile = "tests/python/.coverage";
                if (!require("fs").existsSync(coverageFile)) {
                    return (result +
                        "No coverage data found. Run tests with coverage first:\n" +
                        "  run_tests({ language: 'python', coverage: true })\n");
                }
                // Run coverage report with missing lines
                const proc = spawn("bash", [
                    "-c",
                    "cd tests/python && python3 -m coverage report --show-missing",
                ]);
                let stdout = "";
                proc.stdout.on("data", (data) => {
                    stdout += data.toString();
                });
                await new Promise((resolve) => proc.on("close", () => resolve(undefined)));
                result += `--- Coverage Report ---\n${stdout}\n\n`;
                // Parse for files below threshold
                const lines = stdout.split("\n");
                const lowCoverageFiles = [];
                lines.forEach((line) => {
                    const match = line.match(/(\S+\.py)\s+\d+\s+\d+\s+(\d+)%\s+(.*)/);
                    if (match) {
                        const [, file, coverage, missing] = match;
                        const cov = parseInt(coverage);
                        if (cov < minCoverage) {
                            lowCoverageFiles.push({ file, coverage: cov, missing });
                        }
                    }
                });
                if (lowCoverageFiles.length > 0) {
                    result += `--- Files Below ${minCoverage}% Coverage ---\n\n`;
                    lowCoverageFiles.forEach((item, idx) => {
                        result += `${idx + 1}. ${item.file} (${item.coverage}%)\n`;
                        result += `   Missing lines: ${item.missing}\n\n`;
                    });
                    result += `\n--- Recommended Actions ---\n`;
                    lowCoverageFiles.forEach((item, idx) => {
                        result += `${idx + 1}. ${item.file}:\n`;
                        result += `   - Read the file to understand uncovered code\n`;
                        result += `   - Use generate_tests to create tests for missing lines\n`;
                        result += `   - Focus on: error handling, edge cases, branches\n\n`;
                    });
                }
                else {
                    result += `✅ All files meet ${minCoverage}% coverage threshold!\n`;
                }
            }
            else if (input.language === "java") {
                // Check for JaCoCo report
                const jacocoXml = "tests/java/target/site/jacoco/jacoco.xml";
                if (!require("fs").existsSync(jacocoXml)) {
                    return (result +
                        "No coverage data found. Run tests with coverage first:\n" +
                        "  run_tests({ language: 'java', coverage: true })\n");
                }
                // Parse JaCoCo XML
                const xmlData = require("fs").readFileSync(jacocoXml, "utf-8");
                // Extract package/class coverage
                const packagePattern = /<package name="([^"]+)"[\s\S]*?<counter type="LINE" missed="(\d+)" covered="(\d+)"/g;
                let match;
                const packages = [];
                while ((match = packagePattern.exec(xmlData)) !== null) {
                    const name = match[1];
                    const missed = parseInt(match[2]);
                    const covered = parseInt(match[3]);
                    const total = missed + covered;
                    const coverage = total > 0 ? ((covered / total) * 100).toFixed(2) : 0;
                    if (parseFloat(coverage.toString()) < minCoverage) {
                        packages.push({
                            name,
                            coverage: parseFloat(coverage.toString()),
                            missed,
                            covered,
                        });
                    }
                }
                if (packages.length > 0) {
                    result += `--- Packages Below ${minCoverage}% Coverage ---\n\n`;
                    packages.forEach((pkg, idx) => {
                        result += `${idx + 1}. ${pkg.name} (${pkg.coverage}%)\n`;
                        result += `   Missed: ${pkg.missed} lines, Covered: ${pkg.covered} lines\n\n`;
                    });
                    result += `\n--- Recommended Actions ---\n`;
                    packages.forEach((pkg, idx) => {
                        result += `${idx + 1}. Package: ${pkg.name}\n`;
                        result += `   - Review JaCoCo HTML report for detailed line-by-line coverage\n`;
                        result += `   - Use generate_tests to create missing tests\n`;
                        result += `   - Focus on uncovered branches and error paths\n\n`;
                    });
                }
                else {
                    result += `✅ All packages meet ${minCoverage}% coverage threshold!\n`;
                }
                result += `\nDetailed Report: tests/java/target/site/jacoco/index.html\n`;
            }
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
                result += `def test_regression_${input.bug_description.toLowerCase().replace(/\s+/g, "_").slice(0, 40)}():\n`;
                result += `    """\n`;
                result += `    Regression test for bug:\n`;
                result += `    ${input.bug_description}\n`;
                result += `    \n`;
                result += `    This test ensures the bug does not reoccur.\n`;
                result += `    """\n`;
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
                result += `public void testRegression${input.bug_description.replace(/\s+/g, "_").slice(0, 40)}() {\n`;
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
export const toolDefinitions = [
    readFileDefinition,
    listFilesDefinition,
    writeFileDefinition,
    editFileDefinition,
    scaffoldProjectDefinition,
    patchFileDefinition,
    runCommandDefinition,
    runTestsDefinition,
    analyzeTestFailuresDefinition,
    getCoverageDefinition,
    detectChangedFilesDefinition,
    generateTestsDefinition,
    analyzeCoverageGapsDefinition,
    generateRegressionTestDefinition,
];
