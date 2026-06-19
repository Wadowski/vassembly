import type { BaseMessage } from '@langchain/core/messages';

import type { AiProviderInvokeResult } from '../types';

type TokenUsage = NonNullable<AiProviderInvokeResult['usage']>;

interface UsageMetadata {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
}

interface ResponseTokenUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

const toUsage = ({
  promptTokens,
  completionTokens,
}: {
  promptTokens: number;
  completionTokens: number;
}): TokenUsage => ({
  promptTokens,
  completionTokens,
  totalTokens: promptTokens + completionTokens,
});

const extractFromUsageMetadata = (usageMetadata: UsageMetadata): TokenUsage | undefined => {
  const promptTokens = usageMetadata.input_tokens;
  const completionTokens = usageMetadata.output_tokens;

  if (promptTokens === undefined && completionTokens === undefined) {
    return undefined;
  }

  return toUsage({
    promptTokens: promptTokens ?? 0,
    completionTokens: completionTokens ?? 0,
  });
};

const extractFromResponseMetadata = (
  responseMetadata: Record<string, unknown>,
): TokenUsage | undefined => {
  const tokenUsage = responseMetadata.token_usage as ResponseTokenUsage | undefined;

  if (!tokenUsage) {
    return undefined;
  }

  const promptTokens = tokenUsage.prompt_tokens;
  const completionTokens = tokenUsage.completion_tokens;

  if (promptTokens === undefined && completionTokens === undefined) {
    return undefined;
  }

  return toUsage({
    promptTokens: promptTokens ?? 0,
    completionTokens: completionTokens ?? 0,
  });
};

export const extractTokenUsageFromMessage = (message: BaseMessage): TokenUsage | undefined => {
  const messageRecord = message as BaseMessage & {
    usage_metadata?: UsageMetadata;
    response_metadata?: Record<string, unknown>;
  };

  const fromUsageMetadata = messageRecord.usage_metadata
    ? extractFromUsageMetadata(messageRecord.usage_metadata)
    : undefined;

  if (fromUsageMetadata) {
    return fromUsageMetadata;
  }

  if (messageRecord.response_metadata) {
    return extractFromResponseMetadata(messageRecord.response_metadata);
  }

  return undefined;
};

export const mergeTokenUsage = (
  current: TokenUsage | undefined,
  next: TokenUsage | undefined,
): TokenUsage | undefined => {
  if (!next) {
    return current;
  }

  if (!current) {
    return next;
  }

  return toUsage({
    promptTokens: current.promptTokens + next.promptTokens,
    completionTokens: current.completionTokens + next.completionTokens,
  });
};
