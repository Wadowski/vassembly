import type { PendingQuestionDto } from '@vassembly/ui-api-hooks';

import type { QuestionAnswerValue } from '../types';

export const isAnswerValid = ({
  question,
  value,
}: {
  question: PendingQuestionDto;
  value: QuestionAnswerValue;
}): boolean => {
  if (value === undefined) {
    return false;
  }

  if (question.inputType === 'text') {
    return typeof value === 'string' && value.trim() !== '';
  }

  if (question.inputType === 'select') {
    return typeof value === 'string' && value !== '';
  }

  if (question.inputType === 'multiselect') {
    return Array.isArray(value) && value.length > 0;
  }

  if (question.inputType === 'boolean') {
    return typeof value === 'boolean';
  }

  return false;
};
