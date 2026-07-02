import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { ExecuteParams, ExecutionResult, SandboxScriptLanguage } from '../types';

import { runCommand } from './runCommand';
import { ensureWorkspace } from './workspaceVolume';

const SCRIPT_FILES: Record<Exclude<SandboxScriptLanguage, 'terminal'>, string> = {
  python: 'skill_script.py',
  nodejs: 'skill_script.mjs',
  bash: 'skill_script.sh',
};

interface CommandSpec {
  command: string;
  args: string[];
}

const DEFAULT_SPAWN_PATH = '/usr/local/bin:/usr/bin:/bin';

const buildCommand = (params: ExecuteParams): CommandSpec => {
  const commandBuilders: Record<SandboxScriptLanguage, () => CommandSpec> = {
    python: () => ({
      command: 'python3',
      args: ['skill_script.py', ...(params.args ?? []), '--input', 'input.json'],
    }),
    nodejs: () => ({
      command: 'node',
      args: ['skill_script.mjs', ...(params.args ?? [])],
    }),
    bash: () => ({
      command: 'bash',
      args: ['skill_script.sh', ...(params.args ?? [])],
    }),
    terminal: () => ({
      command: '/bin/sh',
      args: ['-c', params.scriptContent],
    }),
  };

  return commandBuilders[params.language]();
};

const buildSpawnEnv = ({
  workspacePath,
  env,
}: {
  workspacePath: string;
  env?: Record<string, string>;
}): Record<string, string> => ({
  PATH: DEFAULT_SPAWN_PATH,
  SKILL_INPUT_PATH: './input.json',
  SKILL_WORKSPACE_PATH: workspacePath,
  ...env,
});

const truncateOutput = ({
  stdout,
  stderr,
  limits,
}: {
  stdout: string;
  stderr: string;
  limits: ExecuteParams['limits'];
}): Pick<ExecutionResult, 'stdout' | 'stderr' | 'truncated'> => {
  const truncatedStdout = stdout.slice(0, limits.stdoutMaxBytes);
  const truncatedStderr = stderr.slice(0, limits.stderrMaxBytes);
  const truncated =
    truncatedStdout.length < stdout.length || truncatedStderr.length < stderr.length;

  return { stdout: truncatedStdout, stderr: truncatedStderr, truncated };
};

export const executeScript = async (params: ExecuteParams): Promise<ExecutionResult> => {
  const startedAt = Date.now();
  const workspacePath = await ensureWorkspace({ workspaceId: params.workspaceId });

  await writeFile(join(workspacePath, 'input.json'), JSON.stringify(params.input));

  if (params.language !== 'terminal') {
    const scriptFile = SCRIPT_FILES[params.language];
    await writeFile(join(workspacePath, scriptFile), params.scriptContent);
  }

  const { command, args } = buildCommand(params);
  const { exitCode, stdout, stderr } = await runCommand({
    command,
    args,
    cwd: workspacePath,
    env: buildSpawnEnv({ workspacePath, env: params.env }),
  });

  return {
    exitCode,
    durationMs: Date.now() - startedAt,
    ...truncateOutput({ stdout, stderr, limits: params.limits }),
  };
};
