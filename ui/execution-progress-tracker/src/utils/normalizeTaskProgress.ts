import type { ProgressEvent, TaskProgressData } from '../types';

interface RawTokenUsage {
  input: number;
  output: number;
  total: number;
}

interface RawProgressEvent {
  id: string;
  agentId?: string;
  agentName?: string | null;
  parentAgentId?: string | null;
  state: string;
  timestamp: string;
  duration?: number | null;
  inputMessages?: string | null;
  generatedResponse?: string | null;
  tokenUsage?: RawTokenUsage | null;
  errorDetails?: {
    message: string;
    type?: string | null;
    stackTrace?: string | null;
  } | null;
  integrationName?: string | null;
  provider?: string | null;
  model?: string | null;
}

export interface RawTaskProgressData {
  id: string;
  taskId: string;
  startedAt: string;
  completedAt?: string | null;
  totalDuration: number;
  totalTokens: RawTokenUsage;
  executionAttempt?: number;
  events: RawProgressEvent[];
}

const PROGRESS_EVENT_STATE_MAP: Record<string, ProgressEvent['state']> = {
  started: 'STARTED',
  completed: 'COMPLETED',
  failed: 'FAILED',
};

const normalizeProgressEventState = (state: string): ProgressEvent['state'] =>
  PROGRESS_EVENT_STATE_MAP[state] ?? (state as ProgressEvent['state']);

export const normalizeTaskProgress = (raw: RawTaskProgressData): TaskProgressData => ({
  id: raw.id,
  taskId: raw.taskId,
  startedAt: new Date(raw.startedAt),
  completedAt: raw.completedAt ? new Date(raw.completedAt) : null,
  totalDuration: raw.totalDuration,
  totalTokens: raw.totalTokens,
  executionAttempt: raw.executionAttempt ?? 1,
  events: raw.events.map((event) => ({
    id: event.id,
    agentId: event.agentId ?? '',
    agentName: event.agentName ?? 'Unknown agent',
    parentAgentId: event.parentAgentId ?? null,
    state: normalizeProgressEventState(event.state),
    timestamp: new Date(event.timestamp),
    duration: event.duration ?? null,
    inputMessages: event.inputMessages ?? null,
    generatedResponse: event.generatedResponse ?? null,
    tokenUsage: event.tokenUsage ?? null,
    errorDetails: event.errorDetails
      ? {
          message: event.errorDetails.message,
          type: event.errorDetails.type ?? 'unknown',
          stackTrace: event.errorDetails.stackTrace ?? undefined,
        }
      : null,
    integrationName: event.integrationName ?? null,
    provider: event.provider ?? null,
    model: event.model ?? null,
  })),
});
