import z from "zod"
import { Tool } from "./tool"
import DESCRIPTION from "./agent-browser.txt"

export const AgentBrowserTool = Tool.define("agent-browser", {
  description: DESCRIPTION,
  parameters: z.object({
    args: z.array(z.string()).describe("Arguments passed to the agent-browser CLI."),
  }),
  async execute(params, ctx) {
    await ctx.ask({
      permission: "agent-browser",
      patterns: [params.args.join(" ")],
      always: [params.args[0] + "*"],
      metadata: {
        args: params.args,
      },
    })

    const run = async (cmd: string[]) => {
      const proc = Bun.spawn({
        cmd,
        stdout: "pipe",
        stderr: "pipe",
        stdin: "ignore",
      })

      const abortHandler = () => {
        proc.kill()
      }

      ctx.abort.addEventListener("abort", abortHandler, { once: true })

      try {
        const [stdout, stderr, exitCode] = await Promise.all([
          new Response(proc.stdout).text(),
          new Response(proc.stderr).text(),
          proc.exited,
        ])

        return { stdout, stderr, exitCode }
      } finally {
        ctx.abort.removeEventListener("abort", abortHandler)
      }
    }

    let result: Awaited<ReturnType<typeof run>> | undefined
    let lastError: unknown

    try {
      result = await run(["agent-browser", ...params.args])
    } catch (error) {
      lastError = error
    }

    if (!result) {
      result = await run(["bunx", "--bun", "agent-browser", ...params.args]).catch((error) => {
        lastError = error
        return undefined
      })
    }

    if (!result) {
      const message = lastError instanceof Error ? lastError.message : String(lastError)
      return {
        title: "agent-browser",
        metadata: {},
        output: `Unable to start agent-browser.\n\n${message}`,
      }
    }

    if (result.exitCode !== 0) {
      const details = (result.stderr || result.stdout || "").trim()
      return {
        title: "agent-browser",
        metadata: {},
        output: [
          `agent-browser failed with exit code ${result.exitCode}.`,
          details || "No output returned from agent-browser.",
        ].join("\n\n"),
      }
    }

    return {
      title: "agent-browser",
      metadata: {},
      output: (result.stdout || result.stderr || "").trim() || "agent-browser command completed successfully.",
    }
  },
})
