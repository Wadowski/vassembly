'use client';

import { Text } from '@vassembly/ui-system-design/text';
import { TextField } from '@vassembly/ui-system-design/text-field';
import { useState } from 'react';

import styles from '../../SettingsSections.module.scss';

interface SecurityControlledPasswordFieldProps {
  label: string;
  fieldNameForAria: string;
  autoCompletePreference: string;
  valueDraft: string;
  onDraftChange: (nextPassword: string) => void;
  errorCopy?: string;
  isInteractionLocked: boolean;
}

export const SecurityControlledPasswordField = ({
  label,
  fieldNameForAria,
  autoCompletePreference,
  valueDraft,
  onDraftChange,
  errorCopy,
  isInteractionLocked,
}: SecurityControlledPasswordFieldProps): JSX.Element => {
  const [isReadable, setIsReadable] = useState(false);

  return (
    <TextField
      label={label}
      type={isReadable ? 'text' : 'password'}
      value={valueDraft}
      autoComplete={autoCompletePreference}
      isDisabled={isInteractionLocked}
      errorMessage={errorCopy}
      isFullWidth
      onChange={(changeEmit) => {
        onDraftChange(changeEmit.target.value);
      }}
      trailingIcon={
        <button
          type="button"
          className={styles.inlineGhostButton}
          aria-label={
            isReadable ? `Hide password for ${fieldNameForAria}` : `Show password for ${fieldNameForAria}`
          }
          onClick={() => {
            setIsReadable(!isReadable);
          }}
        >
          <Text variant="caption">{isReadable ? 'Hide' : 'Show'}</Text>
        </button>
      }
    />
  );
};
