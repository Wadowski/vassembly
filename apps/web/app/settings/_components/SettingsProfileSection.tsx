'use client';

import { useGetUser, useUpdateUserProfile, type UpdateUserProfileMutationVariables } from '@vassembly/ui-api-hooks';
import { Alert } from '@vassembly/ui-alert';
import { Button } from '@vassembly/ui-button';
import { useSnackbar } from '@vassembly/ui-snackbar';
import { Text } from '@vassembly/ui-text';
import { TextField } from '@vassembly/ui-text-field';
import { useUserAuth } from '@vassembly/ui-user-auth';
import { type FormEvent, useState } from 'react';
import { resolveOfflineRestrictionMessage } from '../../../lib/network/onlineStatus';
import { SETTINGS_PROFILE_NAMES_SCHEMA } from '../formSchemas';
import { useProfileDraftState } from './settingsProfile/useProfileDraftState';
import styles from '../SettingsSections.module.scss';

interface SettingsProfileSectionProps {
  subjectUserId: string;
}

export const SettingsProfileSection = ({
  subjectUserId,
}: SettingsProfileSectionProps): JSX.Element => {
  const { user } = useUserAuth();
  const { data, isLoading } = useGetUser({ userId: subjectUserId });
  const remoteUserPayload = data?.user;
  const {
    draftFirstName,
    draftLastName,
    handleDraftFirstNameChange,
    handleDraftLastNameChange,
    resetDraftBaseline,
  } = useProfileDraftState({ remoteUserPayload });
  const { mutate, isLoading: isSaving } = useUpdateUserProfile();
  const { show: enqueueSnackbar } = useSnackbar();
  const [firstNameErrorMessage, setFirstNameErrorMessage] = useState<string | undefined>(
    undefined,
  );
  const [lastNameErrorMessage, setLastNameErrorMessage] = useState<string | undefined>(undefined);
  const [formWideMessage, setFormWideMessage] = useState<string | undefined>(undefined);

  const handleSubmitProfile = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const offlineMessage = resolveOfflineRestrictionMessage();
    if (offlineMessage) {
      setFormWideMessage(offlineMessage);
      return;
    }

    const validation = SETTINGS_PROFILE_NAMES_SCHEMA.safeParse({
      firstName: draftFirstName,
      lastName: draftLastName,
    });
    if (!validation.success) {
      const firstNameIssue = validation.error.issues.find((issue) => issue.path[0] === 'firstName');
      const lastNameIssue = validation.error.issues.find((issue) => issue.path[0] === 'lastName');

      setFirstNameErrorMessage(
        typeof firstNameIssue?.message === 'string' ? firstNameIssue.message : undefined,
      );
      setLastNameErrorMessage(
        typeof lastNameIssue?.message === 'string' ? lastNameIssue.message : undefined,
      );
      return;
    }

    setFirstNameErrorMessage(undefined);
    setLastNameErrorMessage(undefined);
    setFormWideMessage(undefined);

    const mutationOutcome = await mutate({
      input: { firstName: validation.data.firstName, lastName: validation.data.lastName },
    } as UpdateUserProfileMutationVariables);

    if (!mutationOutcome?.updateUserProfile?.user) {
      enqueueSnackbar({
        variant: 'error',
        message: 'Unable to save profile right now. Try again shortly.',
      });
      return;
    }

    enqueueSnackbar({ variant: 'success', message: 'Profile saved.' });
  };

  return (
    <section id="profile" className={styles.sectionCard}>
      <Text variant="h2">Profile</Text>
      {formWideMessage ? <Alert variant="warning" message={formWideMessage} /> : null}
      <form onSubmit={(event): void => void handleSubmitProfile(event)} className={styles.formStack}>
        <TextField
          label="First name"
          value={draftFirstName}
          errorMessage={firstNameErrorMessage}
          isDisabled={isLoading || isSaving}
          isFullWidth
          autoComplete="given-name"
          onChange={(event) => {
            handleDraftFirstNameChange(event.target.value);
          }}
        />
        <TextField
          label="Last name"
          value={draftLastName}
          errorMessage={lastNameErrorMessage}
          isDisabled={isLoading || isSaving}
          isFullWidth
          autoComplete="family-name"
          onChange={(event) => {
            handleDraftLastNameChange(event.target.value);
          }}
        />
        <TextField
          label="Email"
          value={remoteUserPayload?.email ?? user?.email ?? ''}
          isDisabled
          isReadOnly
          isFullWidth
          helperText="Email changes are unavailable in-app."
        />
        <TextField
          label="Role"
          value={user?.role ?? ''}
          isDisabled
          isReadOnly
          isFullWidth
        />
        <div className={styles.toolbarRow}>
          <Button type="submit" text="Save" isLoading={isSaving} />
          <Button
            variant="text"
            type="button"
            text="Cancel"
            onClick={() => {
              resetDraftBaseline();
              setFirstNameErrorMessage(undefined);
              setLastNameErrorMessage(undefined);
              setFormWideMessage(undefined);
            }}
          />
        </div>
      </form>
    </section>
  );
};
