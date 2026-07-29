import { normalizeToolInput } from './normalizeToolInput';

import type { InternalToolHandler } from '../types';

export const withNormalizedInput = ({
  toolId,
  handler,
}: {
  toolId: string;
  handler: (args: Record<string, unknown>) => Promise<string>;
}): InternalToolHandler => {
  return async (rawArgs: Record<string, unknown>): Promise<string> => {
    const result = normalizeToolInput<Record<string, unknown>>({ toolId, raw: rawArgs });

    if (!result.success) {
      return JSON.stringify(result.errorPayload);
    }

    return handler(result.data);
  };
};
