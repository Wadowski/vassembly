'use client';

import { Text } from '@vassembly/ui-text';

import { formatRelativeTime } from '../../../lib/formatRelativeTime';
import {
  QUESTIONS_HISTORY_ANSWERED_LABEL,
  QUESTIONS_HISTORY_ASKED_LABEL,
} from '../constants';
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
      <div className={styles.timestamps}>
        <Text variant="body2" className={styles.timestamp}>
          {QUESTIONS_HISTORY_ASKED_LABEL} {formatRelativeTime(question.askedAt)}
        </Text>
        <Text variant="body2" className={styles.timestamp}>
          {QUESTIONS_HISTORY_ANSWERED_LABEL} {formatRelativeTime(question.answeredAt)}
        </Text>
      </div>
    </li>
  );
};
