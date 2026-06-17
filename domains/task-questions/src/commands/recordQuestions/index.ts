import { randomUUID } from 'node:crypto';

import { ValidationError } from '@vassembly/errors';
import { z } from 'zod';

import { taskQuestionsMongodbDao } from '../../clients';

import type { RecordQuestionsCommandInput, RecordQuestionsCommandResult } from './types';

const QUESTION_INPUT_SCHEMA = z.object({
  questionId: z.string().min(1).optional(),
  question: z.string().min(1),
  inputType: z.enum(['text', 'select', 'multiselect', 'boolean']).default('text'),
  options: z.array(z.string()).optional(),
  schema: z.record(z.string(), z.unknown()).optional(),
});

const VALIDATION_SCHEMA = z.object({
  taskId: z.string().min(1),
  invocationId: z.string().min(1),
  askedByAgentId: z.string().min(1),
  askedByAgentType: z.enum(['personal', 'system']),
  questions: z.array(QUESTION_INPUT_SCHEMA).min(1),
  resumeCheckpoint: z
    .object({
      messageHistory: z.array(z.unknown()).optional(),
      progressEventIds: z.array(z.string()).optional(),
    })
    .optional(),
});

export const recordQuestions = async (
  input: RecordQuestionsCommandInput,
): Promise<RecordQuestionsCommandResult> => {
  const parsed = VALIDATION_SCHEMA.safeParse(input);

  if (!parsed.success) {
    throw new ValidationError(parsed.error.message);
  }

  const askedAt = new Date();
  const pendingQuestions = parsed.data.questions.map((question) => ({
    questionId: question.questionId ?? randomUUID(),
    invocationId: parsed.data.invocationId,
    askedByAgentId: parsed.data.askedByAgentId,
    askedByAgentType: parsed.data.askedByAgentType,
    question: question.question,
    inputType: question.inputType,
    options: question.options,
    schema: question.schema,
    askedAt,
  }));

  const data = await taskQuestionsMongodbDao.recordQuestions({
    taskId: parsed.data.taskId,
    pendingQuestions,
    blockedInvocation: {
      invocationId: parsed.data.invocationId,
      agentId: parsed.data.askedByAgentId,
      agentType: parsed.data.askedByAgentType,
      blockedAt: askedAt,
      resumeCheckpoint: parsed.data.resumeCheckpoint,
    },
  });

  return { data };
};
