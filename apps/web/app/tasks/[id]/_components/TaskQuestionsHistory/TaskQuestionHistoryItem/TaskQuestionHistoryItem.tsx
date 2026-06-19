'use client';

import { Text } from '@vassembly/ui-text';

import type { TaskQuestionHistoryItemProps } from '../types';
import styles from './TaskQuestionHistoryItem.module.scss';

export const TaskQuestionHistoryItem = ({
  question,
}: TaskQuestionHistoryItemProps): JSX.Element => {
  return (
    <li className={styles.historyItem} data-testid="task-question-history-item">
      <Text variant="body1" className={styles.questionText}>
        {question.question}
      </Text>
      <Text variant="body2" className={styles.answerText} data-testid="task-question-history-answer">
        {question.answer}
      </Text>
    </li>
  );
};
