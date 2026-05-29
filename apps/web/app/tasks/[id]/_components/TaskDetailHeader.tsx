'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@vassembly/ui-button';
import { Text } from '@vassembly/ui-text';

import { TASK_DETAILS_PAGE_TITLE } from '../constants';
import pageStyles from '../TaskDetailPage.module.scss';
import { TaskStatusBadge } from './TaskStatusBadge';
import type { TaskDetailHeaderProps } from './types';

export const TaskDetailHeader = ({ task }: TaskDetailHeaderProps): JSX.Element => {
  const router = useRouter();
  const pageTitle = task.title?.trim() ? task.title.trim() : TASK_DETAILS_PAGE_TITLE;

  const handleBackClick = useCallback((): void => {
    router.push('/');
  }, [router]);

  return (
    <header>
      <div className={pageStyles.utilityHeader}>
        <Button
          className={pageStyles.backLink}
          variant="text"
          color="primary"
          text="← Back to tasks"
          onClick={handleBackClick}
          data-testid="task-detail-back"
        />
        <TaskStatusBadge status={task.status} />
      </div>
      <Text variant="h1" className={pageStyles.pageTitle} data-testid="task-detail-title">
        {pageTitle}
      </Text>
    </header>
  );
};
