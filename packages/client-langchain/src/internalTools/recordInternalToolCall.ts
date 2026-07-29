export interface InternalToolCallRecordStartedInput {
  phase: 'started';
  internalToolId: string;
  toolName: string;
  args: Record<string, unknown>;
  startedAt: Date;
}

export interface InternalToolCallRecordCompletedInput {
  phase: 'completed';
  eventId: string;
  status: 'success' | 'error';
  endedAt: Date;
  durationMs: number;
  errorMessage?: string;
  output?: string;
}

export type InternalToolCallRecordInput =
  | InternalToolCallRecordStartedInput
  | InternalToolCallRecordCompletedInput;

export type RecordInternalToolCall = (input: InternalToolCallRecordInput) => Promise<string | void>;
