import type { PendingQuestionDto, QuestionInputType } from '@vassembly/ui-api-hooks';

export interface TaskQuestionFormProps {
  taskId: string;
  questions: PendingQuestionDto[];
  onAnswerSubmitted: () => void | Promise<void>;
}

export type QuestionAnswerValue = string | string[] | boolean | undefined;

export interface QuestionInputFieldProps {
  question: PendingQuestionDto;
  value: QuestionAnswerValue;
  onChange: (value: QuestionAnswerValue) => void;
  isDisabled: boolean;
}

export interface UseTaskQuestionFormParams {
  taskId: string;
  questions: PendingQuestionDto[];
  onAnswerSubmitted: () => void | Promise<void>;
}

export interface UseTaskQuestionFormResult {
  currentIndex: number;
  currentQuestion: PendingQuestionDto | undefined;
  totalQuestions: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
  isSubmitDisabled: boolean;
  isSubmitting: boolean;
  currentValue: QuestionAnswerValue;
  handlePrevious: () => void;
  handleNext: () => void;
  handleValueChange: (value: QuestionAnswerValue) => void;
  handleSubmit: () => Promise<void>;
}

export type { QuestionInputType };
