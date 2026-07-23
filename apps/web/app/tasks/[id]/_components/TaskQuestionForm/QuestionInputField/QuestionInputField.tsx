'use client';

import { useCallback } from 'react';
import type { ChangeEvent } from 'react';

import { Button } from '@vassembly/ui-system-design/button';
import { Checkbox } from '@vassembly/ui-system-design/checkbox';
import { Dropdown } from '@vassembly/ui-system-design/dropdown';
import { TextField } from '@vassembly/ui-system-design/text-field';

import {
  BOOLEAN_NO_LABEL,
  BOOLEAN_YES_LABEL,
  MULTISELECT_LABEL,
  SELECT_PLACEHOLDER,
  TEXT_ANSWER_PLACEHOLDER,
} from '../constants';
import type { QuestionInputFieldProps } from './types';
import styles from './QuestionInputField.module.scss';

export const QuestionInputField = ({
  question,
  value,
  onChange,
  isDisabled,
}: QuestionInputFieldProps): JSX.Element => {
  const handleTextChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
      onChange(event.target.value);
    },
    [onChange],
  );

  const handleSelectChange = useCallback(
    (nextValue: string): void => {
      onChange(nextValue);
    },
    [onChange],
  );

  const handleBooleanChange = useCallback(
    (nextValue: boolean): void => {
      onChange(nextValue);
    },
    [onChange],
  );

  const handleMultiselectToggle = useCallback(
    (optionValue: string, isChecked: boolean): void => {
      const currentValues = Array.isArray(value) ? value : [];

      if (isChecked) {
        onChange([...currentValues, optionValue]);
        return;
      }

      onChange(currentValues.filter((item) => item !== optionValue));
    },
    [onChange, value],
  );

  if (question.inputType === 'text') {
    return (
      <TextField
        isMultiline
        minRows={4}
        isFullWidth
        label="Your answer"
        placeholder={TEXT_ANSWER_PLACEHOLDER}
        value={typeof value === 'string' ? value : ''}
        onChange={handleTextChange}
        isDisabled={isDisabled}
        data-testid="task-question-text-input"
      />
    );
  }

  if (question.inputType === 'select') {
    const options = (question.options ?? []).map((option) => ({
      value: option,
      label: option,
    }));

    return (
      <div data-testid="task-question-select-input">
        <Dropdown
          isFullWidth
          label="Your answer"
          placeholder={SELECT_PLACEHOLDER}
          options={options}
          value={typeof value === 'string' ? value : ''}
          onValueChange={handleSelectChange}
          isDisabled={isDisabled}
        />
      </div>
    );
  }

  if (question.inputType === 'multiselect') {
    const selectedValues = Array.isArray(value) ? value : [];

    return (
      <fieldset className={styles.multiselectFieldset} disabled={isDisabled}>
        <legend className={styles.multiselectLegend}>{MULTISELECT_LABEL}</legend>
        <div className={styles.multiselectOptions} data-testid="task-question-multiselect-input">
          {(question.options ?? []).map((option) => (
            <Checkbox
              key={option}
              label={option}
              checked={selectedValues.includes(option)}
              onCheckedChange={(checked) => handleMultiselectToggle(option, checked === true)}
              isDisabled={isDisabled}
            />
          ))}
        </div>
      </fieldset>
    );
  }

  const booleanValue = typeof value === 'boolean' ? value : undefined;
  const yesVariant = booleanValue === true ? 'contained' : 'outlined';
  const noVariant = booleanValue === false ? 'contained' : 'outlined';

  return (
    <div className={styles.booleanGroup} data-testid="task-question-boolean-input">
      <Button
        variant={yesVariant}
        color="primary"
        text={BOOLEAN_YES_LABEL}
        onClick={() => handleBooleanChange(true)}
        isDisabled={isDisabled}
        aria-pressed={booleanValue === true}
      />
      <Button
        variant={noVariant}
        color="secondary"
        text={BOOLEAN_NO_LABEL}
        onClick={() => handleBooleanChange(false)}
        isDisabled={isDisabled}
        aria-pressed={booleanValue === false}
      />
    </div>
  );
};
