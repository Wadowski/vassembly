'use client';

import { useCallback, useState } from 'react';

import { Button } from '@vassembly/ui-button';
import { TextField } from '@vassembly/ui-text-field';
import { resolveClassName } from '@vassembly/ui-utils';

import { PASSWORD_KEEP_HINT } from './constants';
import fieldStyles from './McpConfigField.module.scss';
import type { McpSecretFieldProps } from './types';

/**
 * Password field with show/hide toggle and keep-existing hint for saved secrets.
 */
export const McpSecretField = ({
  field,
  value,
  hasSavedSecret,
  error,
  touched,
  isMobile,
  onChange,
  onBlur,
}: McpSecretFieldProps): JSX.Element => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const showKeepHint = hasSavedSecret && value === '';
  const label = field.required ? `${field.label} *` : field.label;
  const hasFieldError = touched && error !== undefined;

  const handleToggleVisibility = useCallback((): void => {
    setIsPasswordVisible((previous) => !previous);
  }, []);

  return (
    <div className={fieldStyles.field}>
      <TextField
        label={label}
        type={isPasswordVisible ? 'text' : 'password'}
        value={value}
        placeholder={field.placeholder}
        helperText={showKeepHint ? PASSWORD_KEEP_HINT : field.description}
        isError={hasFieldError}
        aria-required={field.required ? true : undefined}
        className={resolveClassName(isMobile && `${fieldStyles.touchTarget} touchTarget`)}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
      />
      <Button
        variant="text"
        text={isPasswordVisible ? 'Hide' : 'Show'}
        onClick={handleToggleVisibility}
        className={fieldStyles.toggleButton}
      />
    </div>
  );
};
