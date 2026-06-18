'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useSubmitAnswer } from '@vassembly/ui-api-hooks';

import { isAnswerValid } from './lib/isAnswerValid';
import type {
  QuestionAnswerValue,
  UseTaskQuestionFormParams,
  UseTaskQuestionFormResult,
} from './types';

export const useTaskQuestionForm = ({
  taskId,
  questions,
  onAnswerSubmitted,
}: UseTaskQuestionFormParams): UseTaskQuestionFormResult => {
  const { submitAnswer, isLoading: isSubmitting } = useSubmitAnswer();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [draftAnswers, setDraftAnswers] = useState<Record<string, QuestionAnswerValue>>({});

  useEffect(() => {
    setCurrentIndex((previousIndex) => {
      if (questions.length === 0) {
        return 0;
      }

      return Math.min(previousIndex, questions.length - 1);
    });
  }, [questions]);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < totalQuestions - 1;

  const currentValue = useMemo((): QuestionAnswerValue => {
    if (currentQuestion === undefined) {
      return undefined;
    }

    return draftAnswers[currentQuestion.questionId];
  }, [currentQuestion, draftAnswers]);

  const isSubmitDisabled = useMemo((): boolean => {
    if (currentQuestion === undefined) {
      return true;
    }

    return !isAnswerValid({ question: currentQuestion, value: currentValue });
  }, [currentQuestion, currentValue]);

  const handleValueChange = useCallback((value: QuestionAnswerValue): void => {
    if (currentQuestion === undefined) {
      return;
    }

    setDraftAnswers((previous) => ({
      ...previous,
      [currentQuestion.questionId]: value,
    }));
  }, [currentQuestion]);

  const handlePrevious = useCallback((): void => {
    setCurrentIndex((previous) => Math.max(previous - 1, 0));
  }, []);

  const handleNext = useCallback((): void => {
    setCurrentIndex((previous) => Math.min(previous + 1, totalQuestions - 1));
  }, [totalQuestions]);

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (currentQuestion === undefined || isSubmitDisabled) {
      return;
    }

    await submitAnswer({
      taskId,
      questionId: currentQuestion.questionId,
      body: { answer: currentValue as string | string[] | boolean },
    });

    setDraftAnswers((previous) => {
      const next = { ...previous };
      delete next[currentQuestion.questionId];
      return next;
    });

    if (canGoNext) {
      setCurrentIndex((previous) => Math.min(previous + 1, totalQuestions - 1));
    } else if (canGoPrevious) {
      setCurrentIndex((previous) => Math.max(previous - 1, 0));
    } else {
      setCurrentIndex(0);
    }

    await onAnswerSubmitted();
  }, [
    canGoNext,
    canGoPrevious,
    currentQuestion,
    isSubmitDisabled,
    onAnswerSubmitted,
    submitAnswer,
    taskId,
    totalQuestions,
    currentValue,
  ]);

  return {
    currentIndex,
    currentQuestion,
    totalQuestions,
    canGoPrevious,
    canGoNext,
    isSubmitDisabled,
    isSubmitting,
    currentValue,
    handlePrevious,
    handleNext,
    handleValueChange,
    handleSubmit,
  };
};
