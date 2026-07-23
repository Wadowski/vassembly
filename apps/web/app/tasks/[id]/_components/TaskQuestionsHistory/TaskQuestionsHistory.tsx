'use client';

import { useMemo } from 'react';

import { Text } from '@vassembly/ui-system-design/text';

import pageStyles from '../../TaskDetailPage.module.scss';
import { QUESTIONS_HISTORY_TITLE } from './constants';
import { TaskQuestionHistoryItem } from './TaskQuestionHistoryItem';
import type { TaskQuestionsHistoryProps } from './types';
import styles from './TaskQuestionsHistory.module.scss';

export const TaskQuestionsHistory = ({ questions }: TaskQuestionsHistoryProps): JSX.Element => {
  const sortedQuestions = useMemo(
    () =>
      [...questions].sort(
        (left, right) => new Date(left.answeredAt).getTime() - new Date(right.answeredAt).getTime(),
      ),
    [questions],
  );

  return (
    <section
      aria-labelledby="task-questions-history-heading"
      className={pageStyles.sectionStack}
      data-testid="task-questions-history"
    >
      <Text
        variant="label"
        id="task-questions-history-heading"
        className={pageStyles.sectionLabel}
      >
        {QUESTIONS_HISTORY_TITLE}
      </Text>
      <ul className={styles.historyList} aria-label={QUESTIONS_HISTORY_TITLE}>
        {sortedQuestions.map((question) => (
          <TaskQuestionHistoryItem key={question.questionId} question={question} />
        ))}
      </ul>
    </section>
  );
};
