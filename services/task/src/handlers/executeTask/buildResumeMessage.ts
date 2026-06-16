import { ProgressEventState } from '@vassembly/domain-task-progress';

import type { ProgressEventModel } from '@vassembly/domain-task-progress';

export interface BuildResumeMessageParams {
  description: string;
  events: ProgressEventModel[];
}

export const buildResumeMessage = ({
  description,
  events,
}: BuildResumeMessageParams): string => {
  const completedEvents = events.filter((event) => event.state === ProgressEventState.Completed);

  if (completedEvents.length === 0) {
    return description;
  }

  const stepsSummary = completedEvents
    .map((event, index) => {
      const input = event.inputMessages ?? '';
      const output = event.generatedResponse ?? '';
      return `Step ${index + 1} (agent ${event.agentId}):\nInput: ${input}\nOutput: ${output}`;
    })
    .join('\n\n');

  return [
    description,
    '',
    '--- Previously completed execution steps ---',
    stepsSummary,
    '',
    'Continue from where execution left off. Do not repeat the completed steps above.',
  ].join('\n');
};
