import type { AnsweredQuestion } from '@vassembly/domain-task-questions';

const formatAnswer = (answer: string | string[] | boolean): string => {
  if (Array.isArray(answer)) {
    return JSON.stringify(answer);
  }

  return String(answer);
};

export interface BuildChildResumeMessageParams {
  agentPrompt: string;
  answeredQuestions: AnsweredQuestion[];
}

export const buildChildResumeMessage = ({
  agentPrompt,
  answeredQuestions,
}: BuildChildResumeMessageParams): string => {
  const parts = [agentPrompt];

  if (answeredQuestions.length > 0) {
    parts.push('', '--- User responses received ---');

    for (const question of answeredQuestions) {
      parts.push(
        `Question: "${question.question}"`,
        `Answer: ${formatAnswer(question.answer)}`,
        '',
      );
    }
  }

  parts.push('Continue from where execution left off. Do not repeat completed steps above.');
  return parts.join('\n');
};
