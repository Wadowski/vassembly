'use client';

import { TaskStatus } from '@vassembly/ui-api-hooks';
import { Text } from '@vassembly/ui-text';

import pageStyles from '../../TaskDetailPage.module.scss';
import styles from './TaskDetailAiResponse.module.scss';
import type { TaskDetailAiResponseProps } from './types';

const PROCESSING_LABEL = 'Processing...';
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

  if (task.status !== TaskStatus.Done || !task.llmResponse) {
    return null;
  }

  return (
    <section aria-labelledby="task-detail-ai-response-heading" className={styles.responseBox}>
      <Text variant="label" id="task-detail-ai-response-heading" className={pageStyles.sectionLabel}>
        {RESPONSE_HEADING}
      </Text>
      <Text variant="body2" className={styles.responseBody} data-testid="task-detail-ai-response">
        {task.llmResponse}
      </Text>
    </section>
  );
};
