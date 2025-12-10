import { spawn } from "child_process";

export const runShellCommand = (
  command: string,
  workingDir: string,
  timeoutMs: number,
  env: NodeJS.ProcessEnv = process.env
): Promise<{ stdout: string; stderr: string; exitCode: number; timedOut: boolean }> => {
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const proc = spawn(command, {
      cwd: workingDir,
      shell: true,
      env,
    });

    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill("SIGKILL");
    }, timeoutMs);

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (exitCode) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, exitCode: exitCode ?? 0, timedOut });
    });
  });
};
