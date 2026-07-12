export type SandboxScriptLanguage = 'python' | 'nodejs' | 'bash' | 'terminal';

export interface SandboxLimits {
  memoryLimitMb: number;
  stdoutMaxBytes: number;
  stderrMaxBytes: number;
}

export interface ExecuteParams {
  language: SandboxScriptLanguage;
  scriptContent: string;
  input: Record<string, unknown>;
  env?: Record<string, string>;
  args?: string[];
  workspaceId: string;
  limits: SandboxLimits;
  correlationId: string;
}

export interface ExecutionResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  truncated: boolean;
}

export interface DeleteWorkspaceParams {
  workspaceId: string;
}

export interface SandboxBackendStrategy {
  execute: (params: ExecuteParams) => Promise<ExecutionResult>;
  deleteWorkspace: (params: DeleteWorkspaceParams) => Promise<void>;
}

export interface WorkspaceHandle {
  workspaceId: string;
}
