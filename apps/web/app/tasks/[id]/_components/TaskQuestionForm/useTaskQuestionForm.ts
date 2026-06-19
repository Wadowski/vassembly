'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
  onSubmitError,
}: UseTaskQuestionFormParams): UseTaskQuestionFormResult => {
  const { submitAnswer } = useSubmitAnswer();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [draftAnswers, setDraftAnswers] = useState<Record<string, QuestionAnswerValue>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const isSubmittingRef = useRef(false);

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
    if (currentQuestion === undefined || isProcessing) {
      return true;
    }

    return !isAnswerValid({ question: currentQuestion, value: currentValue });
  }, [currentQuestion, currentValue, isProcessing]);

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
    if (currentQuestion === undefined || isSubmitDisabled || isSubmittingRef.current) {
      return;
    }

    isSubmittingRef.current = true;
    setIsProcessing(true);

    try {
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

      await onAnswerSubmitted();
    } catch {
      onSubmitError();
    } finally {
      isSubmittingRef.current = false;
      setIsProcessing(false);
    }
  }, [
    currentQuestion,
    currentValue,
    isSubmitDisabled,
    onAnswerSubmitted,
    onSubmitError,
    submitAnswer,
    taskId,
  ]);

  return {
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
  };
};
