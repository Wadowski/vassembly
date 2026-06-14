'use client';

import type { ChangeEvent, MouseEvent } from 'react';
import { useCallback } from 'react';

import { CloseIcon } from '@vassembly/ui-icons';
import { TextField } from '@vassembly/ui-text-field';
import { resolveClassName } from '@vassembly/ui-utils';

import styles from './McpSearchBar.module.scss';

export interface McpSearchBarProps {
  value: string;
  isDisabled?: boolean;
  onChange: (value: string) => void;
  onClear: () => void;
}

const SEARCH_PLACEHOLDER = 'Search by name or description';

export const McpSearchBar = ({
  value,
  isDisabled = false,
  onChange,
  onClear,
}: McpSearchBarProps): JSX.Element => {
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
      placeholder={SEARCH_PLACEHOLDER}
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
