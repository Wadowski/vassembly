'use client';

import { TaskStatus } from '@vassembly/ui-api-hooks';
import { Text } from '@vassembly/ui-text';

import pageStyles from '../../TaskDetailPage.module.scss';
import { MarkdownContent } from './MarkdownContent';
import styles from './TaskDetailAiResponse.module.scss';
import type { TaskDetailAiResponseProps } from './types';

const PROCESSING_LABEL = 'Processing...';
const PAUSED_LABEL =
  'Task paused — click Resume to continue, or Retry to restart from scratch.';
const RESPONSE_HEADING = 'AI Response';

export const TaskDetailAiResponse = ({ task }: TaskDetailAiResponseProps): JSX.Element | null => {
  if (task.status === TaskStatus.InProgress) {
    return (
      <section aria-labelledby="task-detail-ai-response-heading" className={pageStyles.sectionCard}>
        <Text variant="body2" id="task-detail-ai-response-heading" data-testid="task-detail-ai-processing">
          {PROCESSING_LABEL}
        </Text>
      </section>
    );
  }

  if (task.status === TaskStatus.Paused) {
    return (
      <section aria-labelledby="task-detail-ai-response-heading" className={pageStyles.sectionCard}>
        <Text
          variant="body2"
          id="task-detail-ai-response-heading"
          className={styles.pausedMessage}
          data-testid="task-detail-ai-paused"
        >
          {PAUSED_LABEL}
        </Text>
      </section>
    );
  }

  if (task.status !== TaskStatus.Done || !task.llmResponse) {
    return null;
  }

  return (
    <section aria-labelledby="task-detail-ai-response-heading" className={styles.responseBox}>
      <Text variant="label" id="task-detail-ai-response-heading" className={pageStyles.sectionLabel}>
        {RESPONSE_HEADING}
      </Text>
      <MarkdownContent
        content={task.llmResponse}
        className={styles.responseBody}
        testId="task-detail-ai-response"
      />
    </section>
  );
};
