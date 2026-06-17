import { ConflictError, ValidationError } from '@vassembly/errors';
import { z } from 'zod';

import { taskQuestionsMongodbDao } from '../../clients';

import type { SubmitAnswerCommandInput, SubmitAnswerCommandResult } from './types';

const VALIDATION_SCHEMA = z.object({
  taskId: z.string().min(1),
  questionId: z.string().min(1),
  answer: z.union([z.string(), z.array(z.string()), z.boolean()]),
});

export const submitAnswer = async (
  input: SubmitAnswerCommandInput,
): Promise<SubmitAnswerCommandResult> => {
  const parsed = VALIDATION_SCHEMA.safeParse(input);

  if (!parsed.success) {
    throw new ValidationError(parsed.error.message);
  }

  const existing = await taskQuestionsMongodbDao.findByTaskId({ taskId: parsed.data.taskId });

  if (!existing) {
    throw new ConflictError('No questions for this task', { code: 'NO_TASK_QUESTIONS' });
  }

  const pendingQuestion = existing.pendingQuestions?.find(
    (question) => question.questionId === parsed.data.questionId,
  );

  if (!pendingQuestion) {
    throw new ConflictError('Question not found in pending', { code: 'QUESTION_NOT_FOUND' });
  }

  const answeredAt = new Date();
  const answeredQuestion = {
    ...pendingQuestion,
    answer: parsed.data.answer,
    answeredAt,
  };

  const data = await taskQuestionsMongodbDao.submitAnswer({
    taskId: parsed.data.taskId,
    questionId: parsed.data.questionId,
    answeredQuestion,
  });

  if (!data) {
    throw new ConflictError('Question not found in pending', { code: 'QUESTION_NOT_FOUND' });
  }

  return { data };
};
