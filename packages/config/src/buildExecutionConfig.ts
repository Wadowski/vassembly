import type { ExecutionConfig, SkillExecutionBackend } from './types';

export interface BuildExecutionConfigParams {
  backend?: SkillExecutionBackend;
}

export const buildExecutionConfig = ({
  backend,
}: BuildExecutionConfigParams = {}): ExecutionConfig => ({
  backend:
    backend ??
    (process.env.SKILLS_EXECUTION_BACKEND === 'cloud' ? 'cloud' : 'local'),
  stdoutMaxBytes: Number(process.env.SKILLS_EXECUTION_STDOUT_MAX_BYTES) || 262_144,
  stderrMaxBytes: Number(process.env.SKILLS_EXECUTION_STDERR_MAX_BYTES) || 65_536,
  memoryLimitMb: Number(process.env.SKILLS_EXECUTION_MEMORY_LIMIT_MB) || 256,
  local: {
    workerUrl: process.env.SKILLS_EXECUTION_WORKER_URL || 'http://localhost:4010',
  },
  cloud: {
    workerUrl: process.env.SKILLS_EXECUTION_CLOUD_WORKER_URL || '',
    apiKey: process.env.SKILLS_EXECUTION_CLOUD_API_KEY,
    warmPoolSize: Number(process.env.SKILLS_EXECUTION_WARM_POOL_SIZE) || 2,
  },
});
