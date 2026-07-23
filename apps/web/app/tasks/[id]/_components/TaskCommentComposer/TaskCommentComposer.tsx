import type { ChangeEvent } from 'react';
import { useState } from 'react';

import { Button } from '@vassembly/ui-system-design/button';
import { TextField } from '@vassembly/ui-system-design/text-field';

import {
  TaskStatus,
  useSubmitTaskComment,
  type SubmitTaskCommentResponse,
} from '@vassembly/ui-api-hooks';

import styles from './TaskCommentComposer.module.scss';

export interface TaskCommentComposerProps {
  taskId: string;
  taskStatus: TaskStatus;
  onSubmitted: (response: SubmitTaskCommentResponse) => void;
}

export const TaskCommentComposer = ({
  taskId,
  taskStatus,
  onSubmitted,
}: TaskCommentComposerProps): JSX.Element => {
  const { submit, isLoading } = useSubmitTaskComment();
  const [userText, setUserText] = useState('');

  const isDisabled =
    isLoading ||
    taskStatus === TaskStatus.InProgress ||
    taskStatus === TaskStatus.Paused;

  const handleSubmit = async (): Promise<void> => {
    if (userText.trim() === '') {
      return;
    }

    const response = await submit({ taskId, userText: userText.trim() });
    setUserText('');
    onSubmitted(response);
  };

  return (
    <section className={styles.composer} data-testid="task-comment-composer">
      <TextField
        isMultiline
        isFullWidth
        minRows={4}
        value={userText}
        onChange={(event: ChangeEvent<HTMLInputElement>) => setUserText(event.target.value)}
        placeholder="Add a follow-up comment…"
        isDisabled={isDisabled}
      />
      <Button
        variant="contained"
        color="primary"
        text="Submit"
        onClick={() => void handleSubmit()}
        isDisabled={isDisabled}
        isLoading={isLoading}
      />
    </section>
  );
};
