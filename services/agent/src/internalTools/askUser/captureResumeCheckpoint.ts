import type { InternalToolContext } from '../types';

export interface InvocationResumeCheckpoint {
  messageHistory?: unknown[];
  progressEventIds?: string[];
}

export interface CaptureResumeCheckpointParams {
  context: InternalToolContext;
}

export const captureResumeCheckpoint = ({
  context,
}: CaptureResumeCheckpointParams): InvocationResumeCheckpoint => ({
  progressEventIds: [context.invocationId],
});
