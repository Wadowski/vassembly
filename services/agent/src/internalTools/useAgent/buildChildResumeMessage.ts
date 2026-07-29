import type { AnsweredQuestion } from '@vassembly/domain-task-questions';

export interface BuildChildResumeMessageParams {
  agentPrompt: string;
  answeredQuestions: AnsweredQuestion[];
}

const formatAnswer = (answer: string | string[] | boolean): string => {
  if (Array.isArray(answer)) {
    return JSON.stringify(answer);
  }

  return String(answer);
};

export const buildChildResumeMessage = ({
  agentPrompt,
  answeredQuestions,
}: BuildChildResumeMessageParams): string => {
  const parts = [agentPrompt];

  if (answeredQuestions.length > 0) {
    parts.push('', '--- User responses received ---');
    for (const qa of answeredQuestions) {
      parts.push(`Question: "${qa.question}"`, `Answer: ${formatAnswer(qa.answer)}`, '');
    }
  }

  parts.push('Continue from where execution left off. Do not repeat completed steps above.');
  return parts.join('\n');
};
