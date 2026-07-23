'use client';

import type { ChangeEvent, MouseEvent } from 'react';
import { useCallback } from 'react';

import { CloseIcon } from '@vassembly/ui-system-design/icons';
import { TextField } from '@vassembly/ui-system-design/text-field';
import { resolveClassName } from '@vassembly/ui-system-design/utils';

import styles from './PanelSearchBar.module.scss';

export interface PanelSearchBarProps {
  value: string;
  placeholder: string;
  ariaLabel: string;
  isDisabled?: boolean;
  onChange: (value: string) => void;
  onClear: () => void;
}

export const PanelSearchBar = ({
  value,
  placeholder,
  ariaLabel,
  isDisabled = false,
  onChange,
  onClear,
}: PanelSearchBarProps): JSX.Element => {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      onChange(event.target.value);
    },
    [onChange],
  );

  const handleClearClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>): void => {
      event.preventDefault();
      onClear();
    },
    [onClear],
  );

  const hasValue = value.trim() !== '';
  const clearButtonClassName = resolveClassName(styles.clearButton, !hasValue && styles.clearButtonHidden);

  return (
    <TextField
      className={styles.searchField}
      size="small"
      placeholder={placeholder}
      aria-label={ariaLabel}
      isDisabled={isDisabled}
      value={value}
      onChange={handleChange}
      trailingIcon={
        <button
          type="button"
          className={clearButtonClassName}
          aria-label="Clear search"
          onClick={handleClearClick}
          tabIndex={hasValue ? 0 : -1}
        >
          <CloseIcon className={styles.clearIcon} aria-hidden />
        </button>
      }
    />
  );
};
