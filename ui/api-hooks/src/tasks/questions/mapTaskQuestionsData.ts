import { ValidationError } from '@vassembly/errors';

import type {
  AnsweredQuestionDto,
  GraphQLAnsweredQuestionRow,
  GraphQLPendingQuestionRow,
  GraphQLTaskQuestionsData,
  PendingQuestionDto,
  QuestionInputType,
  TaskQuestionsDto,
} from './types';

const QUESTION_INPUT_TYPES: QuestionInputType[] = ['text', 'select', 'multiselect', 'boolean'];

const toQuestionInputType = (value: string | null | undefined): QuestionInputType => {
  if (value && QUESTION_INPUT_TYPES.includes(value as QuestionInputType)) {
    return value as QuestionInputType;
  }

  throw new ValidationError('inputType is invalid');
};

const toPendingQuestionDto = (row: GraphQLPendingQuestionRow): PendingQuestionDto => ({
  questionId: row.questionId ?? '',
  invocationId: row.invocationId ?? '',
  askedByAgentId: row.askedByAgentId ?? '',
  askedByAgentType: row.askedByAgentType ?? '',
  question: row.question ?? '',
  inputType: toQuestionInputType(row.inputType),
  options: row.options ?? null,
  askedAt: row.askedAt ?? '',
});

const toAnsweredQuestionDto = (row: GraphQLAnsweredQuestionRow): AnsweredQuestionDto => ({
  ...toPendingQuestionDto(row),
  answer: row.answer ?? '',
  answeredAt: row.answeredAt ?? '',
});

export const mapTaskQuestionsData = (
  data: GraphQLTaskQuestionsData | undefined,
): TaskQuestionsDto | undefined => {
  const taskQuestions = data?.taskQuestions;

  if (!taskQuestions) {
    return undefined;
  }

  return {
    taskId: taskQuestions.taskId ?? '',
    pendingQuestions: (taskQuestions.pendingQuestions ?? []).map(toPendingQuestionDto),
    answeredQuestions: (taskQuestions.answeredQuestions ?? []).map(toAnsweredQuestionDto),
  };
};
