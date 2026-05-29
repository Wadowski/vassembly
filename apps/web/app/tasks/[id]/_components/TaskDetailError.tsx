'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@vassembly/ui-button';
import { Text } from '@vassembly/ui-text';

import {
  TASK_NOT_FOUND_DETAIL,
  TASK_NOT_FOUND_MESSAGE,
} from '../constants';
import pageStyles from '../TaskDetailPage.module.scss';
import type { TaskDetailErrorProps } from './types';

export const TaskDetailError = ({
  variant,
  message,
  onRetry,
}: TaskDetailErrorProps): JSX.Element => {
  const router = useRouter();

  const handleBackClick = useCallback((): void => {
    router.push('/');
  }, [router]);

  if (variant === 'notFound') {
    return (
      <main className={pageStyles.pageStack} role="alert">
        <div className={pageStyles.errorStack}>
          <Text variant="h1">{TASK_NOT_FOUND_MESSAGE}</Text>
          <Text variant="body2" className={pageStyles.errorDetail}>
            {TASK_NOT_FOUND_DETAIL}
          </Text>
          <div className={pageStyles.errorActions}>
            <Button variant="contained" text="Back to tasks" onClick={handleBackClick} />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={pageStyles.pageStack} role="alert">
      <div className={pageStyles.errorStack}>
        <Text variant="body1">{message}</Text>
        <div className={pageStyles.errorActions}>
          {onRetry !== undefined ? (
            <Button variant="outlined" text="Try again" onClick={onRetry} />
          ) : null}
          <Button variant="text" text="Back to tasks" onClick={handleBackClick} />
        </div>
      </div>
    </main>
  );
};
