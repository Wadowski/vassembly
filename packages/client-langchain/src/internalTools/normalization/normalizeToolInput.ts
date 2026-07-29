import { getInternalToolById } from '@vassembly/constants';
import {
  buildMissingFieldsErrorPayload,
  normalizeToolInputShape,
} from '@vassembly/validation';

import { TOOL_NORMALIZERS } from './toolNormalizers';

import type { NormalizeToolInputResult } from './types';

export const normalizeToolInput = <T>({
  toolId,
  raw,
}: {
  toolId: string;
  raw: unknown;
}): NormalizeToolInputResult<T> => {
  const normalizer = TOOL_NORMALIZERS[toolId];
  const definition = getInternalToolById(toolId);

  if (!normalizer || !definition) {
    return {
      success: false,
      errorPayload: {
        error: `Unknown internal tool: ${toolId}`,
        code: 'INVALID_SHAPE',
      },
    };
  }

  const shaped = normalizeToolInputShape({ raw, config: normalizer.shapeCoercion });
  const transformed = normalizer.transformShapedInput
    ? normalizer.transformShapedInput(shaped)
    : shaped;
  const result = normalizer.schema.safeParse(transformed);

  if (result.success) {
    return { success: true, data: result.data as T };
  }

  return {
    success: false,
    errorPayload: buildMissingFieldsErrorPayload({
      issues: result.error.issues,
      toolLabel: definition.llmToolName,
    }),
  };
};
