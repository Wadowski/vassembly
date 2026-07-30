import { tryParseJson } from '@vassembly/validation';

import type { ToolInputErrorPayload } from '@vassembly/validation';

export const PERSIST_TASK_PLAN_TOOL_NAME = 'persist_task_plan';

const tryParseJsonObject = (content: string): Record<string, unknown> | null => {
  const parsed = tryParseJson({ raw: content });

  if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
    return parsed as Record<string, unknown>;
  }

  return null;
};

const isSuccessfulPersistTaskPlanContent = ({ content }: { content: string }): boolean => {
  const parsed = tryParseJsonObject(content);

  if (!parsed) {
    return false;
  }

  if (typeof parsed.error === 'string' && parsed.error.length > 0) {
    return false;
  }

  if (parsed.code) {
    return false;
  }

  return typeof parsed.taskPlanInstanceId === 'string' && parsed.taskPlanInstanceId.length > 0;
};

const isStandardToolErrorPayload = (parsed: Record<string, unknown>): boolean => {
  return typeof parsed.error === 'string' && parsed.error.length > 0;
};

export const isSuccessfulRequiredToolResult = ({
  toolName,
  content,
}: {
  toolName: string;
  content: string;
}): boolean => {
  const parsed = tryParseJsonObject(content);

  if (parsed && isStandardToolErrorPayload(parsed)) {
    return false;
  }

  if (toolName === PERSIST_TASK_PLAN_TOOL_NAME) {
    return isSuccessfulPersistTaskPlanContent({ content });
  }

  return content.trim().length > 0;
};

export const hasRequiredToolSucceeded = ({
  requiredSuccessfulToolName,
  executedToolResults,
}: {
  requiredSuccessfulToolName: string;
  executedToolResults: Array<{ toolName: string; content: string }>;
}): boolean => {
  const matchingResults = executedToolResults.filter(
    (result) => result.toolName === requiredSuccessfulToolName,
  );

  if (matchingResults.length === 0) {
    return false;
  }

  const lastResult = matchingResults[matchingResults.length - 1]!;

  return isSuccessfulRequiredToolResult({
    toolName: requiredSuccessfulToolName,
    content: lastResult.content,
  });
};

const findLastAttempt = ({
  toolName,
  executedToolResults,
}: {
  toolName: string;
  executedToolResults: Array<{ toolName: string; content: string }>;
}): { toolName: string; content: string } | undefined => {
  return [...executedToolResults].reverse().find((result) => result.toolName === toolName);
};

export const buildRequiredToolNudgeMessage = ({
  requiredSuccessfulToolName,
  executedToolResults,
}: {
  requiredSuccessfulToolName: string;
  executedToolResults: Array<{ toolName: string; content: string }>;
}): string => {
  const lastAttempt = findLastAttempt({
    toolName: requiredSuccessfulToolName,
    executedToolResults,
  });
  const parsed = lastAttempt
    ? (tryParseJsonObject(lastAttempt.content) as ToolInputErrorPayload | null)
    : null;

  if (parsed?.missingFields?.length) {
    return `${requiredSuccessfulToolName} failed: ${parsed.error}. ${parsed.hint ?? ''} Do not reply with prose until it succeeds.`;
  }

  if (parsed?.error) {
    return `${requiredSuccessfulToolName} failed: ${parsed.error}. Fix the payload and call ${requiredSuccessfulToolName} again. Do not reply with prose until it succeeds.`;
  }

  if (requiredSuccessfulToolName === PERSIST_TASK_PLAN_TOOL_NAME) {
    return 'You must call persist_task_plan now with the complete plan as valid JSON. Do not finish with prose until persist_task_plan returns taskPlanInstanceId.';
  }

  return `You must call ${requiredSuccessfulToolName} successfully before finishing.`;
};
