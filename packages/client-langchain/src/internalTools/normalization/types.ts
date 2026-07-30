import type { ShapeCoercionConfig } from '@vassembly/validation';
import type { ZodTypeAny } from 'zod';

export interface ToolNormalizer {
  schema: ZodTypeAny;
  shapeCoercion: ShapeCoercionConfig;
  transformShapedInput?: (record: Record<string, unknown>) => Record<string, unknown>;
}

export type NormalizeToolInputResult<T> =
  | { success: true; data: T }
  | { success: false; errorPayload: import('@vassembly/validation').ToolInputErrorPayload };
