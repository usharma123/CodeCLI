import * as fs from "fs/promises";
import * as path from "path";
import { ToolDefinition, ScaffoldProjectInput } from "../types.js";
import { confirmAction } from "../confirm.js";
import { colors } from "../../utils/colors.js";

type TemplateFile = { path: string; content: string };

const sanitizeName = (name: string): string => {
  const safe = name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return safe || "app";
};

const getApiTemplate = (base: string, name: string): TemplateFile[] => {
  return [
    {
      path: `${base}/package.json`,
      content: JSON.stringify(
        {
          name: sanitizeName(name || "api-server"),
          type: "module",
          scripts: {
            dev: "bun --watch src/server.ts",
            start: "bun src/server.ts",
          },
          dependencies: {
            express: "^4.18.2",
            cors: "^2.8.5",
            dotenv: "^16.3.1",
          },
          devDependencies: {
            typescript: "^5.3.3",
            tsx: "^4.6.2",
            "@types/express": "^4.17.21",
            "@types/node": "^20.10.4",
          },
        },
        null,
        2
      ),
    },
    {
      path: `${base}/tsconfig.json`,
      content: JSON.stringify(
        {
          compilerOptions: {
            target: "ES2020",
            module: "ESNext",
            moduleResolution: "Node",
            esModuleInterop: true,
            allowSyntheticDefaultImports: true,
            strict: true,
            skipLibCheck: true,
            outDir: "dist",
          },
          include: ["src/**/*"],
          exclude: ["node_modules"],
        },
        null,
        2
      ),
    },
    {
      path: `${base}/src/server.ts`,
      content: `import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "Hello from your API!" });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(\`API server running on http://localhost:\${port}\`);
});
`,
    },
    {
      path: `${base}/.env.example`,
      content: `PORT=3000
`,
    },
    {
      path: `${base}/README.md`,
      content: `# ${name || "API Server"}

## Run
bun install
bun run dev   # http://localhost:3000

## Build
bun run start
`,
    },
  ];
};

const getChatbotTemplate = (
  base: string,
  name: string,
  model?: string
): TemplateFile[] => {
  const modelName = model || "anthropic/claude-3.5-sonnet";
  return [
    {
      path: `${base}/package.json`,
      content: JSON.stringify(
        {
          name: sanitizeName(name || "chatbot-api"),
          type: "module",
          scripts: {
            dev: "bun --watch src/server.ts",
            start: "bun src/server.ts",
          },
          dependencies: {
            openai: "^4.56.0",
            express: "^4.18.2",
            cors: "^2.8.5",
            dotenv: "^16.3.1",
          },
          devDependencies: {
            typescript: "^5.3.3",
            tsx: "^4.6.2",
            "@types/express": "^4.17.21",
            "@types/node": "^20.10.4",
          },
        },
        null,
        2
      ),
    },
    {
      path: `${base}/tsconfig.json`,
      content: JSON.stringify(
        {
          compilerOptions: {
            target: "ES2020",
            module: "ESNext",
            moduleResolution: "Node",
            esModuleInterop: true,
            allowSyntheticDefaultImports: true,
            strict: true,
            skipLibCheck: true,
            outDir: "dist",
          },
          include: ["src/**/*"],
          exclude: ["node_modules"],
        },
        null,
        2
      ),
    },
    {
      path: `${base}/src/server.ts`,
      content: `import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://github.com/yourusername/ai-coding-agent",
    "X-Title": "AI Coding Agent",
  },
});

app.post("/chat", async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages array is required" });
  }

  try {
    const completion = await client.chat.completions.create({
      model: "${modelName}",
      messages,
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Failed to generate reply" });
  }
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(\`Chatbot API running on http://localhost:\${port}\`);
});
`,
    },
    {
      path: `${base}/.env.example`,
      content: `OPENROUTER_API_KEY=sk-or-v1-your-key
PORT=3001
`,
    },
    {
      path: `${base}/README.md`,
      content: `# ${name || "Chatbot API"}

## Run
bun install
bun run dev   # http://localhost:3001

## Build
bun run start

## Chat
POST /chat with { "messages": [{ "role": "user", "content": "Hello" }] }
`,
    },
  ];
};

const getStaticTemplate = (base: string, name: string): TemplateFile[] => {
  return [
    {
      path: `${base}/index.html`,
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${name || "Static Site"}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      margin: 0;
      padding: 40px;
      line-height: 1.6;
    }
    .container {
      max-width: 960px;
      margin: 0 auto;
    }
    h1 {
      color: #7dd3fc;
      letter-spacing: -0.01em;
    }
    p {
      color: #cbd5e1;
    }
    .card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      padding: 24px;
      margin-top: 16px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
    }
    a {
      color: #7dd3fc;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${name || "Static Site"}</h1>
    <p>Welcome! Customize this page in <code>index.html</code>.</p>
    <div class="card">
      <h2>Next steps</h2>
      <ul>
        <li>Edit <code>index.html</code></li>
        <li>Add CSS/JS as needed</li>
        <li>Deploy to static hosting</li>
      </ul>
    </div>
  </div>
</body>
</html>
`,
    },
    {
      path: `${base}/README.md`,
      content: `# ${name || "Static Site"}

Edit \`index.html\` and deploy anywhere static hosting works (Netlify, Vercel, S3).
`,
    },
  ];
};

const getReactTemplate = (
  base: string,
  name: string,
  includeApi?: boolean
): TemplateFile[] => {
  const appName = name || "react-app";
  const files: TemplateFile[] = [
    {
      path: `${base}/package.json`,
      content: JSON.stringify(
        {
          name: sanitizeName(appName),
          type: "module",
          scripts: {
            dev: "bun run --bun vite",
            build: "bun run --bun vite build",
            preview: "bun run --bun vite preview",
          },
          dependencies: {
            react: "^18.2.0",
            "react-dom": "^18.2.0",
          },
          devDependencies: {
            vite: "^5.0.0",
            typescript: "^5.3.3",
            "@types/react": "^18.2.15",
            "@types/react-dom": "^18.2.7",
          },
        },
        null,
        2
      ),
    },
    {
      path: `${base}/tsconfig.json`,
      content: JSON.stringify(
        {
          compilerOptions: {
            target: "ES2020",
            module: "ESNext",
            moduleResolution: "Node",
            jsx: "react-jsx",
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
            forceConsistentCasingInFileNames: true,
          },
          include: ["src/**/*"],
          exclude: ["node_modules"],
        },
        null,
        2
      ),
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
import "./styles.css";

const App = () => (
  <div className="app">
    <h1>${name || "React App"}</h1>
    <p>Start building in <code>src/main.tsx</code></p>
  </div>
);

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
`,
    },
    {
      path: `${base}/src/styles.css`,
      content: `* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: #0f172a;
  color: #e2e8f0;
}
.app {
  max-width: 720px;
  margin: 0 auto;
  padding: 48px 24px;
}
h1 {
  color: #7dd3fc;
  letter-spacing: -0.01em;
}
code {
  background: rgba(255, 255, 255, 0.06);
  padding: 2px 6px;
  border-radius: 6px;
}
`,
    },
    {
      path: `${base}/src/vite-env.d.ts`,
      content: `/// <reference types="vite/client" />
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
    files.push(
      ...getApiTemplate(`${base}/api`, `${name || "api"}-api`).map((file) => ({
        ...file,
        path: file.path,
      }))
    );
  }

  return files;
};

const buildTemplateFiles = (
  input: ScaffoldProjectInput
): { baseDir: string; files: TemplateFile[]; description: string } => {
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

const scaffoldProjectDefinition: ToolDefinition = {
  name: "scaffold_project",
  description:
    "Scaffold a project using Bun. Supported templates: api, chatbot, static, react (include_api optional).",
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
        description:
          "Model identifier for chatbot template (e.g., anthropic/claude-3.5-sonnet)",
      },
      include_api: {
        type: "boolean",
        description: "For react template, also scaffold an API folder",
      },
    },
    required: ["template"],
    additionalProperties: false,
  },
  function: async (input: ScaffoldProjectInput) => {
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

export const scaffoldTools = [scaffoldProjectDefinition];
