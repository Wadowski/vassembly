import { config } from '@vassembly/config';
import { createSandboxClient, WorkspaceManager } from '@vassembly/client-sandbox';
import skillDomain, { SKILL_SCRIPT_MAX_SIZE_BYTES } from '@vassembly/domain-skill';
import { ForbiddenError, ValidationError } from '@vassembly/errors';

import { parseRuleDirectives } from './parseRuleDirectives';
import { resolveActiveSkill } from './resolveActiveSkill';
import { resolveScriptFilename } from './resolveScriptFilename';
import { truncateOutput } from './truncateOutput';

import type { InternalToolContext } from '../types';
import type { RunSkillScriptHandlerParams, RunSkillScriptToolResult } from './types';

const ALLOWED_ENV_KEYS = new Set([
  'SKILL_INPUT_PATH',
  'SKILL_NAME',
  'SKILL_FILENAME',
  'TASK_ID',
  'SKILL_WORKSPACE_PATH',
]);

const sandboxStrategy = createSandboxClient(config.skills.execution);
const workspaceManager = WorkspaceManager({ strategy: sandboxStrategy });

const buildWorkspaceId = ({ context }: { context: InternalToolContext }): string =>
  `${context.taskId}:${context.rootInvokeId}`;

const assertSkillAuthorized = ({
  skillSpecializationId,
  context,
}: {
  skillSpecializationId: string;
  context: InternalToolContext;
}): void => {
  const allowedIds =
    context.specializationIds?.filter(
      (id): id is string => typeof id === 'string' && id.length > 0,
    ) ?? [];

  if (allowedIds.length > 0 && !allowedIds.includes(skillSpecializationId)) {
    throw new ForbiddenError('Skill is outside authorized specialization scope');
  }
};

const filterAllowlistedEnv = ({
  env,
}: {
  env?: Record<string, string>;
}): Record<string, string> | undefined => {
  if (!env) {
    return undefined;
  }

  const filtered = Object.fromEntries(
    Object.entries(env).filter(([key]) => ALLOWED_ENV_KEYS.has(key)),
  );

  return Object.keys(filtered).length > 0 ? filtered : undefined;
};

export const runSkillScriptForContext = async ({
  skillName,
  filename,
  skillId: skillIdArg,
  specializationId: specializationIdArg,
  input = {},
  env,
  args,
  context,
}: RunSkillScriptHandlerParams & { context: InternalToolContext }): Promise<RunSkillScriptToolResult> => {
  const normalizedSkillName = skillName.trim();
  const normalizedFilename = filename.trim();
  const normalizedSkillId = skillIdArg?.trim() ?? '';

  if (!normalizedSkillName) {
    throw new ValidationError('skillName is required');
  }

  if (!normalizedFilename) {
    throw new ValidationError('filename is required');
  }

  const activeSkill = normalizedSkillId
    ? await skillDomain.queries.getActiveRuleById({ skillId: normalizedSkillId })
    : await resolveActiveSkill({
        skillName: normalizedSkillName,
        specializationIdArg,
        context,
      });

  assertSkillAuthorized({
    skillSpecializationId: activeSkill.specializationId,
    context,
  });

  const resolvedFilename =
    activeSkill.scripts.find((entry) => entry.filename === normalizedFilename)?.filename ??
    resolveScriptFilename({
      scriptRef: normalizedFilename,
      scripts: activeSkill.scripts,
    });

  const scriptMeta = resolvedFilename
    ? activeSkill.scripts.find((entry) => entry.filename === resolvedFilename)
    : undefined;

  if (!scriptMeta || !resolvedFilename) {
    const availableScripts =
      activeSkill.scripts.length > 0
        ? activeSkill.scripts.map((entry) => entry.filename).join(', ')
        : 'none';

    throw new ValidationError(
      `Script "${normalizedFilename}" not found on skill "${normalizedSkillName}". Available scripts: ${availableScripts}`,
    );
  }

  const { content } = await skillDomain.queries.getScriptContent({
    skillId: activeSkill.skillId,
    filename: resolvedFilename,
  });

  if (content.length > SKILL_SCRIPT_MAX_SIZE_BYTES) {
    throw new ValidationError('Script content exceeds maximum size');
  }

  const workspaceId = buildWorkspaceId({ context });
  await workspaceManager.getOrCreateWorkspace({ workspaceId });

  const execution = config.skills.execution;
  const result = await sandboxStrategy.execute({
    language: scriptMeta.language,
    scriptContent: content,
    input,
    env: filterAllowlistedEnv({ env }),
    args,
    workspaceId,
    limits: {
      memoryLimitMb: execution.memoryLimitMb,
      stdoutMaxBytes: execution.stdoutMaxBytes,
      stderrMaxBytes: execution.stderrMaxBytes,
    },
    correlationId: context.invocationId,
  });

  const truncated = truncateOutput({
    stdout: result.stdout,
    stderr: result.stderr,
    stdoutMaxBytes: execution.stdoutMaxBytes,
    stderrMaxBytes: execution.stderrMaxBytes,
  });

  return {
    skillName: normalizedSkillName,
    filename: resolvedFilename,
    exitCode: result.exitCode,
    stdout: truncated.stdout,
    stderr: truncated.stderr,
    durationMs: result.durationMs,
    truncated: truncated.truncated || result.truncated,
  };
};

export const runSkillScriptToolHandler = async (
  args: Record<string, unknown>,
  context: InternalToolContext,
): Promise<string> => {
  const skillName = typeof args.skillName === 'string' ? args.skillName : '';
  const filename = typeof args.filename === 'string' ? args.filename : '';
  const skillId = typeof args.skillId === 'string' ? args.skillId : undefined;
  const specializationId =
    typeof args.specializationId === 'string' ? args.specializationId : undefined;
  const input =
    args.input !== null && typeof args.input === 'object' && !Array.isArray(args.input)
      ? (args.input as Record<string, unknown>)
      : undefined;
  const env =
    args.env !== null && typeof args.env === 'object' && !Array.isArray(args.env)
      ? Object.fromEntries(
          Object.entries(args.env as Record<string, unknown>).filter(
            (entry): entry is [string, string] => typeof entry[1] === 'string',
          ),
        )
      : undefined;
  const argsList = Array.isArray(args.args)
    ? args.args.filter((entry): entry is string => typeof entry === 'string')
    : undefined;

  const result = await runSkillScriptForContext({
    skillName,
    filename,
    skillId,
    specializationId,
    input,
    env,
    args: argsList,
    context,
  });

  return JSON.stringify(result satisfies RunSkillScriptToolResult);
};

export interface RunAutoScriptsFromRuleParams {
  rule: string;
  skillName: string;
  scripts: Array<{ filename: string; skillId: string; skillName: string }>;
  specializationId?: string;
  context: InternalToolContext;
}

export const runAutoScriptsFromRule = async ({
  rule,
  skillName,
  scripts,
  specializationId,
  context,
}: RunAutoScriptsFromRuleParams): Promise<RunSkillScriptToolResult[]> => {
  const directives = parseRuleDirectives({ rule, skillName, scripts });

  if (directives.length === 0) {
    return [];
  }

  const results: RunSkillScriptToolResult[] = [];

  for (const directive of directives) {
    const result = await runSkillScriptForContext({
      skillName: directive.skillName,
      filename: directive.filename,
      skillId: directive.skillId,
      specializationId,
      context,
    });
    results.push(result);
  }

  return results;
};
