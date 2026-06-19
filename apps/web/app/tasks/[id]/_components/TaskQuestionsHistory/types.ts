import type { AnsweredQuestionDto } from '@vassembly/ui-api-hooks';

export interface TaskQuestionsHistoryProps {
  questions: AnsweredQuestionDto[];
}

export interface TaskQuestionHistoryItemProps {
  question: AnsweredQuestionDto;
}
