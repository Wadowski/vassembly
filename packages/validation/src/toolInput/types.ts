export interface ToolInputIssueLike {
  path: Array<string | number>;
  message: string;
  code?: string;
}

export type ToolInputErrorCode =
  | 'MISSING_REQUIRED_FIELDS'
  | 'INVALID_SHAPE'
  | 'PARSE_ERROR'
  | 'MCP_TOOL_ERROR';

export interface ToolInputErrorPayload {
  error: string;
  code: ToolInputErrorCode;
  missingFields?: string[];
  hint?: string;
}

export interface ShapeCoercionConfig {
  nullableToUndefinedFields?: string[];
  arrayDefaultFields?: string[];
  numericFields?: string[];
  recordJsonFields?: string[];
}
