'use client';

import type { ChangeEvent, FormEvent } from 'react';

import {
  FORM_LIMITS,
  PROVIDER_OPTIONS,
  type AiIntegrationFormInput,
  type TestConnectionResult,
} from '@vassembly/ui-api-hooks';
import { Alert } from '@vassembly/ui-alert';
import { Button } from '@vassembly/ui-button';
import { Dropdown } from '@vassembly/ui-dropdown';
import { Text } from '@vassembly/ui-text';
import { TextField } from '@vassembly/ui-text-field';

import styles from './styles.module.scss';
import { TestConnectionButton } from './TestConnectionButton';

const PROVIDER_DROPDOWN_OPTIONS = PROVIDER_OPTIONS.map((option) => ({
  value: option.id,
  label: option.label,
}));

export interface AiIntegrationFormProps {
  values: AiIntegrationFormInput;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isTesting?: boolean;
  testResult?: TestConnectionResult;
  isEditing?: boolean;
  onChange: <K extends keyof AiIntegrationFormInput>(field: K, value: AiIntegrationFormInput[K]) => void;
  onBlur: (field: keyof AiIntegrationFormInput) => void;
  onSubmit: (event: FormEvent) => void;
  onTest: () => void;
}

export function AiIntegrationForm({
  values,
  errors,
  touched,
  isSubmitting,
  isTesting = false,
  testResult,
  isEditing = false,
  onChange,
  onBlur,
  onSubmit,
  onTest,
}: AiIntegrationFormProps): JSX.Element {
  const showError = (field: keyof AiIntegrationFormInput): string | undefined =>
    touched[field] ? errors[field] : undefined;

  const apiKeyHelper =
    isEditing && !values.apiKey?.trim()
      ? 'Leave blank to keep the existing key.'
      : undefined;

  return (
    <div className={styles.formCard}>
      <form onSubmit={onSubmit} className={styles.form}>
        <Text variant="h2">{isEditing ? 'Edit integration' : 'Create new integration'}</Text>

        <TextField
          label="Name"
          value={values.name}
          errorMessage={showError('name')}
          helperText={showError('name')}
          isFullWidth
          maxLength={FORM_LIMITS.nameMaxLength}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onChange('name', event.target.value)}
          onBlur={() => onBlur('name')}
        />

        <Dropdown
          id="ai-integration-provider"
          className={styles.providerDropdown}
          label="Provider"
          options={PROVIDER_DROPDOWN_OPTIONS}
          value={values.provider}
          isDisabled={isEditing}
          isFullWidth
          onValueChange={(value) => onChange('provider', value as AiIntegrationFormInput['provider'])}
          onBlur={() => onBlur('provider')}
        />
        {showError('provider') !== undefined ? <Text variant="body2">{showError('provider')}</Text> : null}

        <TextField
          label={values.provider === 'lm_studio' ? 'API key (optional)' : 'API key'}
          type="password"
          value={values.apiKey ?? ''}
          errorMessage={showError('apiKey')}
          helperText={showError('apiKey') ?? apiKeyHelper}
          isFullWidth
          maxLength={FORM_LIMITS.apiKeyMaxLength}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onChange('apiKey', event.target.value || undefined)}
          onBlur={() => onBlur('apiKey')}
        />

        {values.provider === 'lm_studio' ? (
          <TextField
            label="Base URL"
            placeholder="http://localhost:1234"
            value={values.baseUrl ?? ''}
            errorMessage={showError('baseUrl')}
            helperText={showError('baseUrl')}
            isFullWidth
            maxLength={FORM_LIMITS.baseUrlMaxLength}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onChange('baseUrl', event.target.value === '' ? null : event.target.value)
            }
            onBlur={() => onBlur('baseUrl')}
          />
        ) : null}

        {values.provider === 'deep_seek' ? (
          <TextField
            label="Base URL (optional)"
            placeholder="https://api.deepseek.com"
            value={values.baseUrl ?? ''}
            errorMessage={showError('baseUrl')}
            helperText={showError('baseUrl')}
            isFullWidth
            maxLength={FORM_LIMITS.baseUrlMaxLength}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onChange('baseUrl', event.target.value === '' ? null : event.target.value)
            }
            onBlur={() => onBlur('baseUrl')}
          />
        ) : null}

        {values.provider === 'chatgpt' ? (
          <TextField
            label="Organization ID (optional)"
            value={values.organizationId ?? ''}
            isFullWidth
            maxLength={FORM_LIMITS.organizationIdMaxLength}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onChange('organizationId', event.target.value === '' ? null : event.target.value)
            }
            onBlur={() => onBlur('organizationId')}
          />
        ) : null}

        <TestConnectionButton isTesting={isTesting} testResult={testResult} onTest={onTest} />

        {testResult?.success === false && testResult.error !== undefined ? (
          <Alert variant="error" message={testResult.error} />
        ) : null}

        {testResult?.success === true ? (
          <Alert variant="success" message="Connection successful — select a model below" />
        ) : null}

        {testResult?.success === true ? (
          <>
            <Dropdown
              id="ai-integration-model"
              className={styles.modelDropdown}
              label="Model"
              options={(testResult.models ?? []).map((model) => ({
                value: model,
                label: model,
              }))}
              value={values.model}
              isFullWidth
              onValueChange={(value) => onChange('model', value)}
              onBlur={() => onBlur('model')}
            />
            {showError('model') !== undefined ? <Text variant="body2">{showError('model')}</Text> : null}
          </>
        ) : null}

        <div className={styles.actions}>
          <Button
            type="submit"
            variant="contained"
            text={isEditing ? 'Update integration' : 'Create integration'}
            isDisabled={isSubmitting || isTesting || testResult?.success !== true}
            isLoading={isSubmitting}
          />
        </div>
      </form>
    </div>
  );
}
