import { spawn } from "child_process";

export const runShellCommand = (
  command: string,
  workingDir: string,
  timeoutMs: number,
  env: NodeJS.ProcessEnv = process.env,
  streamOutput: boolean = false
): Promise<{ stdout: string; stderr: string; exitCode: number; timedOut: boolean }> => {
  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let resolved = false;

    const proc = spawn(command, {
      cwd: workingDir,
      shell: true,
      env,
    });

    const cleanup = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
      }
    };

    const timer = setTimeout(() => {
      timedOut = true;
      // Try graceful termination first (SIGTERM), then force kill after 1s
      proc.kill("SIGTERM");
      setTimeout(() => {
        if (!proc.killed) {
          proc.kill("SIGKILL");
        }
      }, 1000);
    }, timeoutMs);

    proc.stdout?.on("data", (data) => {
      const chunk = data.toString();
      stdout += chunk;
      if (streamOutput) {
        process.stdout.write(chunk);
      }
    });

    proc.stderr?.on("data", (data) => {
      const chunk = data.toString();
      stderr += chunk;
      if (streamOutput) {
        process.stderr.write(chunk);
      }
    });

    proc.on("error", (error) => {
      cleanup();
      reject(new Error(`Failed to spawn process: ${error.message}`));
    });

    proc.on("close", (exitCode) => {
      cleanup();
      resolve({ stdout, stderr, exitCode: exitCode ?? 0, timedOut });
    });
  });
};
