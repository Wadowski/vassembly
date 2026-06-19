import { toIsoString } from '@vassembly/mappers';

import type {
  AnsweredQuestionResponse,
  PendingQuestionResponse,
  TaskQuestionsResponse,
} from './dto';
import type { AnsweredQuestion, PendingQuestion, TaskQuestionsModel } from './model';

const formatAnswer = (answer: string | string[] | boolean): string => {
  if (Array.isArray(answer)) {
    return JSON.stringify(answer);
  }

  return String(answer);
};

const toPendingQuestionResponse = (question: PendingQuestion): PendingQuestionResponse => ({
  questionId: question.questionId,
  invocationId: question.invocationId,
  askedByAgentId: question.askedByAgentId,
  askedByAgentType: question.askedByAgentType,
  question: question.question,
  inputType: question.inputType,
  options: question.options ?? null,
  schema: question.schema ?? null,
  askedAt: toIsoString({ value: question.askedAt, fieldName: 'askedAt' }),
});

const toAnsweredQuestionResponse = (question: AnsweredQuestion): AnsweredQuestionResponse => ({
  ...toPendingQuestionResponse(question),
  answer: formatAnswer(question.answer),
  answeredAt: toIsoString({ value: question.answeredAt, fieldName: 'answeredAt' }),
});

export interface ToTaskQuestionsResponseParams {
  taskQuestions: TaskQuestionsModel;
}

export const toTaskQuestionsResponse = ({
  taskQuestions,
}: ToTaskQuestionsResponseParams): TaskQuestionsResponse => ({
  taskId: taskQuestions.taskId!,
  pendingQuestions: (taskQuestions.pendingQuestions ?? []).map(toPendingQuestionResponse),
  answeredQuestions: (taskQuestions.answeredQuestions ?? []).map(toAnsweredQuestionResponse),
});
