import { ValidationError } from '@vassembly/errors';

import type {
  AskUserQuestionInput,
  NormalizeAskUserArgsParams,
  NormalizeAskUserArgsResult,
} from './types';

const INPUT_TYPES = new Set(['text', 'select', 'multiselect', 'boolean']);

const normalizeQuestionInput = (
  questionInput: AskUserQuestionInput,
): NormalizeAskUserArgsResult['questions'][number] => {
  const question = questionInput.question?.trim();

  if (!question) {
    throw new ValidationError('Each question must be a non-empty string');
  }

  const inputType = questionInput.input_type ?? 'text';

  if (!INPUT_TYPES.has(inputType)) {
    throw new ValidationError('input_type must be one of: text, select, multiselect, boolean');
  }

  return {
    question,
    inputType,
    options: questionInput.options,
    schema: questionInput.schema,
  };
};

const parseBatchQuestions = (args: Record<string, unknown>): AskUserQuestionInput[] => {
  const questions = args.questions;

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new ValidationError('questions must be a non-empty array when provided');
  }

  return questions.map((entry) => {
    if (!entry || typeof entry !== 'object') {
      throw new ValidationError('Each question entry must be an object');
    }

    return entry as AskUserQuestionInput;
  });
};

export const normalizeAskUserArgs = ({
  args,
}: NormalizeAskUserArgsParams): NormalizeAskUserArgsResult => {
  const singleQuestion = typeof args.question === 'string' ? args.question.trim() : '';
  const hasBatch = Array.isArray(args.questions) && args.questions.length > 0;

  if (singleQuestion && hasBatch) {
    throw new ValidationError('Provide either question or questions, not both');
  }

  if (!singleQuestion && !hasBatch) {
    throw new ValidationError('Provide question or a non-empty questions array');
  }

  if (hasBatch) {
    return {
      questions: parseBatchQuestions(args).map(normalizeQuestionInput),
    };
  }

  return {
    questions: [
      normalizeQuestionInput({
        question: singleQuestion,
        input_type:
          typeof args.input_type === 'string'
            ? (args.input_type as AskUserQuestionInput['input_type'])
            : undefined,
        options: Array.isArray(args.options)
          ? args.options.filter((option): option is string => typeof option === 'string')
          : undefined,
        schema:
          args.schema && typeof args.schema === 'object'
            ? (args.schema as Record<string, unknown>)
            : undefined,
      }),
    ],
  };
};
