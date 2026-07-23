'use client';

import Link from 'next/link';

import { TaskStatus } from '@vassembly/ui-api-hooks';
import { Text } from '@vassembly/ui-system-design/text';

import {
  TASK_EXECUTION_SETTINGS_PATH,
  TASK_MISSING_CREDENTIAL_ERROR_CODE,
} from '../../constants';
import styles from './TaskDetailExecutionError.module.scss';
import type { TaskDetailExecutionErrorProps } from './types';

const EXECUTION_FAILED_HEADING = 'Execution Failed';
const SETTINGS_LINK_LABEL = 'Configure AI settings →';

export const TaskDetailExecutionError = ({
  task,
}: TaskDetailExecutionErrorProps): JSX.Element | null => {
  if (task.status !== TaskStatus.Failed) {
    return null;
  }

  const showSettingsLink = task.errorCode === TASK_MISSING_CREDENTIAL_ERROR_CODE;

  return (
    <section
      aria-labelledby="task-detail-execution-error-heading"
      className={styles.errorBox}
      data-testid="task-detail-execution-error"
    >
      <Text variant="label" id="task-detail-execution-error-heading" className={styles.errorHeading}>
        {EXECUTION_FAILED_HEADING}
      </Text>
      <Text variant="body2" className={styles.errorMessage}>
        {task.errorMessage}
      </Text>
      {showSettingsLink ? (
        <Link href={TASK_EXECUTION_SETTINGS_PATH} className={styles.settingsLink}>
          <Text variant="body2">{SETTINGS_LINK_LABEL}</Text>
        </Link>
      ) : null}
    </section>
  );
};
