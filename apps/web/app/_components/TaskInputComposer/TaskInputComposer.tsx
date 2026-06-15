'use client';

import type { ChangeEvent, FormEvent, FormEventHandler } from 'react';
import { useCallback } from 'react';

import { Button } from '@vassembly/ui-button';
import { useSnackbar } from '@vassembly/ui-snackbar';
import { Text } from '@vassembly/ui-text';
import { TextField } from '@vassembly/ui-text-field';

import { TASK_DESCRIPTION_MAX_LENGTH, TASK_INPUT_PLACEHOLDER } from './constants';
import styles from './TaskInputComposer.module.scss';
import { useTaskInput } from './useTaskInput';
import type { TaskInputComposerProps } from './types';

export const TaskInputComposer = ({ onCreateSuccess }: TaskInputComposerProps): JSX.Element => {
  const snackbar = useSnackbar();
  const { input, setInput, isLoading, error, handleSubmit, handleBlur } = useTaskInput();

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      setInput(event.target.value);
    },
    [setInput],
  );

  const handleFormSubmit: FormEventHandler<HTMLFormElement> = useCallback(
    async (event: FormEvent<HTMLFormElement>): Promise<void> => {
      event.preventDefault();
      const result = await handleSubmit();
      if (result === undefined) {
        return;
      }
      if (result.status === 'success') {
        await onCreateSuccess?.();
        snackbar.show({
          variant: 'success',
          message: 'Task created successfully',
          duration: 4000,
        });
        return;
      }
      if (result.status === 'error') {
        snackbar.show({
          variant: 'error',
          message: `Failed to create task: ${result.message}`,
          duration: 5000,
        });
      }
    },
    [handleSubmit, onCreateSuccess, snackbar],
  );

  return (
    <section className={styles.container}>
      <header className={styles.heading}>
        <Text variant="h1" as="h1">
          What&apos;s next?
        </Text>
        <Text variant="h3" as="h2">
          Every task starts with a thought
        </Text>
      </header>
      <form className={styles.form} onSubmit={handleFormSubmit}>
        <TextField
          className={styles.inputField}
          isMultiline
          isFullWidth
          minRows={4}
          placeholder={TASK_INPUT_PLACEHOLDER}
          value={input}
          onChange={handleInputChange}
          onBlur={handleBlur}
          maxLength={TASK_DESCRIPTION_MAX_LENGTH}
          isDisabled={isLoading}
          errorMessage={error ?? undefined}
          isError={error !== null}
        />
        <div className={styles.actions}>
          <Button
            type="submit"
            color="primary"
            variant="contained"
            text="Create Task"
            className={styles.submitButton}
            isDisabled={isLoading}
            isLoading={isLoading}
          />
        </div>
      </form>
    </section>
  );
};
