'use client';

import { Button } from '@vassembly/ui-button';
import { Text } from '@vassembly/ui-text';

import {
  QUESTION_FORM_NAVIGATION_LABEL,
  QUESTION_FORM_NEXT_LABEL,
  QUESTION_FORM_PREVIOUS_LABEL,
  QUESTION_FORM_PROGRESS_LABEL,
  QUESTION_FORM_SUBMIT_LABEL,
  QUESTION_FORM_TITLE,
} from './constants';
import { QuestionInputField } from './QuestionInputField';
import type { TaskQuestionFormProps } from './types';
import { useTaskQuestionForm } from './useTaskQuestionForm';
import styles from './TaskQuestionForm.module.scss';

export const TaskQuestionForm = ({
  taskId,
  questions,
  onAnswerSubmitted,
  onSubmitError,
}: TaskQuestionFormProps): JSX.Element | null => {
  const {
    currentIndex,
    currentQuestion,
    totalQuestions,
    canGoPrevious,
    canGoNext,
    isSubmitDisabled,
    isProcessing,
    currentValue,
    handlePrevious,
    handleNext,
    handleValueChange,
    handleSubmit,
  } = useTaskQuestionForm({ taskId, questions, onAnswerSubmitted, onSubmitError });

  if (currentQuestion === undefined) {
    return null;
  }

  const progressLabel = QUESTION_FORM_PROGRESS_LABEL.replace(
    '{current}',
    String(currentIndex + 1),
  ).replace('{total}', String(totalQuestions));

  return (
    <section
      aria-labelledby="task-question-form-heading"
      className={styles.questionForm}
      data-testid="task-question-form"
    >
      <Text variant="label" id="task-question-form-heading" className={styles.formTitle}>
        {QUESTION_FORM_TITLE}
      </Text>
      <Text variant="body2" className={styles.progressLabel} data-testid="task-question-progress">
        {progressLabel}
      </Text>
      <Text variant="body1" className={styles.questionText} data-testid="task-question-text">
        {currentQuestion.question}
      </Text>
      <QuestionInputField
        question={currentQuestion}
        value={currentValue}
        onChange={handleValueChange}
        isDisabled={isProcessing}
      />
      <div className={styles.actions} role="group" aria-label={QUESTION_FORM_NAVIGATION_LABEL}>
        <div className={styles.navigationButtons}>
          <Button
            variant="outlined"
            color="secondary"
            text={QUESTION_FORM_PREVIOUS_LABEL}
            onClick={handlePrevious}
            isDisabled={!canGoPrevious || isProcessing}
            data-testid="task-question-previous"
          />
          <Button
            variant="outlined"
            color="secondary"
            text={QUESTION_FORM_NEXT_LABEL}
            onClick={handleNext}
            isDisabled={!canGoNext || isProcessing}
            data-testid="task-question-next"
          />
        </div>
        <Button
          variant="contained"
          color="primary"
          text={QUESTION_FORM_SUBMIT_LABEL}
          onClick={handleSubmit}
          isDisabled={isSubmitDisabled}
          isLoading={isProcessing}
          data-testid="task-question-submit"
        />
      </div>
    </section>
  );
};
