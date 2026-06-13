'use client';

import type { FormEvent } from 'react';

import { useChangePassword } from '@vassembly/ui-api-hooks';
import { Alert } from '@vassembly/ui-alert';
import { Button } from '@vassembly/ui-button';
import { useSnackbar } from '@vassembly/ui-snackbar';
import { Text } from '@vassembly/ui-text';
import { useState } from 'react';
import { getValidatorIssues } from '@vassembly/validation';

import { resolveOfflineRestrictionMessage } from '../../onlineStatus';
import { validateSettingsChangePasswordForm } from '../../formSchemas';
import styles from '../../SettingsSections.module.scss';
import { SecurityControlledPasswordField } from './SecurityControlledPasswordField';

export const SettingsSecurityInteractiveBody = (): JSX.Element => {
  const { mutate, isLoading } = useChangePassword();
  const { show: enqueueSnackbar } = useSnackbar();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inlineFieldIssues, setInlineFieldIssues] = useState<Record<string, string>>({});
  const [formAmbientCopy, setFormAmbientCopy] = useState<string | undefined>(undefined);

  const submitPasswordAttempt = async (eventSubmit: FormEvent<HTMLFormElement>): Promise<void> => {
    eventSubmit.preventDefault();
    const offlineCopy = resolveOfflineRestrictionMessage();

    if (offlineCopy) {
      setFormAmbientCopy(offlineCopy);
      return;
    }

    setFormAmbientCopy(undefined);

    const validated = validateSettingsChangePasswordForm({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!validated.success) {
      const keyedEntries = getValidatorIssues(validated)
        .map((singleIssue): [string, string] | undefined => {
          const piece = singleIssue.path[0];
          if (typeof piece !== 'string') {
            return undefined;
          }
          return [piece, singleIssue.message];
        })
        .filter((candidate): candidate is [string, string] => Boolean(candidate));

      setInlineFieldIssues(Object.fromEntries(keyedEntries));
      return;
    }

    setInlineFieldIssues({});

    const envelope = await mutate({
      input: {
        currentPassword: validated.data.currentPassword,
        newPassword: validated.data.newPassword,
      },
    });

    if (!envelope?.changePassword?.success) {
      enqueueSnackbar({
        variant: 'error',
        message: 'Password change rejected. Confirm your current password.',
      });
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    enqueueSnackbar({ variant: 'success', message: 'Password updated.' });
  };

  return (
    <>
      <Text variant="h2">Security</Text>
      {formAmbientCopy ? <Alert variant="warning" message={formAmbientCopy} /> : null}
      <form className={styles.formStack} onSubmit={(submission) => void submitPasswordAttempt(submission)}>
        <SecurityControlledPasswordField
          label="Current password"
          fieldNameForAria="current password"
          autoCompletePreference="current-password"
          valueDraft={currentPassword}
          errorCopy={inlineFieldIssues.currentPassword}
          isInteractionLocked={isLoading}
          onDraftChange={setCurrentPassword}
        />
        <SecurityControlledPasswordField
          label="New password"
          fieldNameForAria="new password"
          autoCompletePreference="new-password"
          valueDraft={newPassword}
          errorCopy={inlineFieldIssues.newPassword}
          isInteractionLocked={isLoading}
          onDraftChange={setNewPassword}
        />
        <SecurityControlledPasswordField
          label="Confirm password"
          fieldNameForAria="confirmation password"
          autoCompletePreference="new-password"
          valueDraft={confirmPassword}
          errorCopy={inlineFieldIssues.confirmPassword}
          isInteractionLocked={isLoading}
          onDraftChange={setConfirmPassword}
        />
        <Button text="Save new password" type="submit" isLoading={isLoading} />
      </form>
    </>
  );
};
