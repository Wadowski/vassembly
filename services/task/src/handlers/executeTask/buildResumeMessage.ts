import { ProgressEventState } from '@vassembly/domain-task-progress';

import type { AnsweredQuestion } from '@vassembly/domain-task-questions';
import type { ProgressEventModel } from '@vassembly/domain-task-progress';

export interface BuildResumeMessageParams {
  description: string;
  events: ProgressEventModel[];
  answeredQuestions?: AnsweredQuestion[];
}

const formatAnswer = (answer: string | string[] | boolean): string => {
  if (Array.isArray(answer)) {
    return JSON.stringify(answer);
  }

  return String(answer);
};

export const buildResumeMessage = ({
  description,
  events,
  answeredQuestions = [],
}: BuildResumeMessageParams): string => {
  const completedEvents = events.filter((event) => event.state === ProgressEventState.Completed);
  const parts = [description];

  if (completedEvents.length > 0) {
    const stepsSummary = completedEvents
      .map((event, index) => {
        const input = event.inputMessages ?? '';
        const output = event.generatedResponse ?? '';
        return `Step ${index + 1} (agent ${event.agentId}):\nInput: ${input}\nOutput: ${output}`;
      })
      .join('\n\n');

    parts.push('', '--- Previously completed execution steps ---', stepsSummary);
  }

  if (answeredQuestions.length > 0) {
    parts.push('', '--- User responses received ---');
    for (const qa of answeredQuestions) {
      parts.push(`Question: "${qa.question}"`, `Answer: ${formatAnswer(qa.answer)}`, '');
    }
  }

  if (completedEvents.length > 0 || answeredQuestions.length > 0) {
    parts.push('Continue from where execution left off. Do not repeat completed steps above.');
  }

  return parts.join('\n');
};
