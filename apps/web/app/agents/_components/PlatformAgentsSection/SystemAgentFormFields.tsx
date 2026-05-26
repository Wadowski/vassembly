'use client';

import type { ChangeEvent } from 'react';

import { Dropdown } from '@vassembly/ui-dropdown';
import { Text } from '@vassembly/ui-text';
import { TextField } from '@vassembly/ui-text-field';

import { SYSTEM_AGENT_CATEGORY_OPTIONS, SYSTEM_AGENT_DESCRIPTION_MAX, SYSTEM_AGENT_RULE_MAX } from './constants';
import type { SystemAgentFormFieldsProps } from './types';
import styles from './styles.module.scss';

export function SystemAgentFormFields({
  form,
  nameErrorOverride,
  isDisabled = false,
  onSubmit,
}: SystemAgentFormFieldsProps): JSX.Element {
  const nameError = nameErrorOverride ?? form.getFieldErrorMessage('name');

  return (
    <form className={styles.modalStack} onSubmit={onSubmit} noValidate>
      <TextField
        label="Name"
        value={form.values.name}
        errorMessage={nameError}
        isDisabled={isDisabled}
        isFullWidth
        aria-invalid={nameError !== undefined}
        onChange={(event: ChangeEvent<HTMLInputElement>) => form.setField('name', event.target.value)}
        onBlur={() => form.blurField('name')}
      />
      <Text variant="body2">Must be unique across active platform agents (max 100 characters).</Text>
      <Dropdown
        id="system-agent-category"
        label="Category"
        placeholder="Select category"
        options={SYSTEM_AGENT_CATEGORY_OPTIONS}
        value={form.values.category}
        isDisabled={isDisabled}
        isFullWidth
        onValueChange={(value) =>
          form.setField('category', value === '' ? '' : (value as typeof form.values.category))
        }
        onBlur={() => form.blurField('category')}
      />
      {form.getFieldErrorMessage('category') !== undefined ? (
        <Text variant="body2">{form.getFieldErrorMessage('category')}</Text>
      ) : null}
      <TextField
        label="Description"
        value={form.values.description}
        errorMessage={form.getFieldErrorMessage('description')}
        isDisabled={isDisabled}
        isFullWidth
        isMultiline
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          form.setField('description', event.target.value)
        }
        onBlur={() => form.blurField('description')}
      />
      <Text variant="body2">{`${form.descriptionCharCount}/${SYSTEM_AGENT_DESCRIPTION_MAX}`}</Text>
      <TextField
        label="Rule"
        value={form.values.rule}
        errorMessage={form.getFieldErrorMessage('rule')}
        isDisabled={isDisabled}
        isFullWidth
        isMultiline
        onChange={(event: ChangeEvent<HTMLInputElement>) => form.setField('rule', event.target.value)}
        onBlur={() => form.blurField('rule')}
      />
      <Text variant="body2">{`${form.ruleCharCount}/${SYSTEM_AGENT_RULE_MAX}`}</Text>
      <Text variant="body2">System prompt applied when users run this agent.</Text>
    </form>
  );
}
