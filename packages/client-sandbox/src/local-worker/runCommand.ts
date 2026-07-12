import { spawn } from 'node:child_process';

export interface RunCommandParams {
  command: string;
  args: string[];
  cwd: string;
  env: Record<string, string>;
}

export interface RunCommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export const runCommand = ({
  command,
  args,
  cwd,
  env,
}: RunCommandParams): Promise<RunCommandResult> =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);
    child.on('close', (code) => {
      resolve({ exitCode: code ?? 1, stdout, stderr });
    });
  });
