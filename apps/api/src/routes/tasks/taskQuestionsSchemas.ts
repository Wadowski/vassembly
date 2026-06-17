import { z } from 'zod';

const pendingQuestionSchema = z.object({
  questionId: z.string(),
  invocationId: z.string(),
  askedByAgentId: z.string(),
  askedByAgentType: z.string(),
  question: z.string(),
  inputType: z.string(),
  options: z.array(z.string()).nullable(),
  schema: z.record(z.string(), z.unknown()).nullable().optional(),
  askedAt: z.string(),
});

const answeredQuestionSchema = pendingQuestionSchema.extend({
  answer: z.string(),
  answeredAt: z.string(),
});

export const taskQuestionsResponseSchema = z.object({
  taskId: z.string(),
  pendingQuestions: z.array(pendingQuestionSchema),
  answeredQuestions: z.array(answeredQuestionSchema),
});

export const submitAnswerBodySchema = z.object({
  answer: z.union([z.string(), z.array(z.string()), z.boolean()]),
});
