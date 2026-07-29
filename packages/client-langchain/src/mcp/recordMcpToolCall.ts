export interface McpToolCallRecordStartedInput {
  phase: 'started';
  mcpId: string;
  toolName: string;
  originalToolName: string;
  args: Record<string, unknown>;
  startedAt: Date;
}

export interface McpToolCallRecordCompletedInput {
  phase: 'completed';
  eventId: string;
  status: 'success' | 'error';
  endedAt: Date;
  durationMs: number;
  errorMessage?: string;
  output?: string;
}

export type McpToolCallRecordInput =
  | McpToolCallRecordStartedInput
  | McpToolCallRecordCompletedInput;

export type RecordMcpToolCall = (input: McpToolCallRecordInput) => Promise<string | void>;
