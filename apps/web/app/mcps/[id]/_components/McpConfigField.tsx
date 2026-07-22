'use client';

import { Checkbox } from '@vassembly/ui-system-design/checkbox';
import { Text } from '@vassembly/ui-system-design/text';
import { TextField } from '@vassembly/ui-system-design/text-field';
import { resolveClassName } from '@vassembly/ui-system-design/utils';

import { McpSecretField } from './McpSecretField';

import styles from './McpConfigField.module.scss';
import type { McpConfigFieldProps } from './types';

/**
 * Dispatches MCP config schema fields to the appropriate input control.
 */
export const McpConfigField = ({
  field,
  value,
  error,
  touched,
  isMobile,
  hasSavedSecret = false,
  onChange,
  onBlur,
}: McpConfigFieldProps): JSX.Element => {
  const touchClass = isMobile ? `${styles.touchTarget} touchTarget` : undefined;

  if (field.type === 'password') {
    return (
      <McpSecretField
        field={field}
        value={String(value)}
        hasSavedSecret={hasSavedSecret}
        error={error}
        touched={touched}
        isMobile={isMobile}
        onChange={onChange}
        onBlur={onBlur}
      />
    );
  }

  if (field.type === 'select') {
    const label = field.required ? `${field.label} *` : field.label;

    return (
      <div className={styles.field}>
        <Text variant="label" as="label" htmlFor={field.key} className={styles.selectLabel}>
          {label}
        </Text>
        <select
          id={field.key}
          aria-label={field.label}
          aria-required={field.required ? true : undefined}
          value={value === null || value === undefined ? '' : String(value)}
          className={resolveClassName(styles.select, touchClass, touched && error !== undefined && styles.selectError)}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
        >
          <option value="">Select…</option>
          {field.options?.map((option: { value: string; label: string }) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {field.description !== undefined ? (
          <Text variant="caption" className={styles.selectHelper}>{field.description}</Text>
        ) : null}
        {null}
      </div>
    );
  }

  if (field.type === 'checkbox') {
    return (
      <div className={styles.field}>
        <Checkbox
          checked={value === true}
          label={field.label}
          description={field.description}
          isRequired={field.required ?? false}
          variant={touched && error !== undefined ? 'error' : 'default'}
          onCheckedChange={(checked) => onChange(checked === true)}
        />
      </div>
    );
  }

  const inputType = field.format === 'email' ? 'email' : field.format === 'url' ? 'url' : 'text';
  const label = field.required ? `${field.label} *` : field.label;
  const isContactEmailField = field.key === 'contactEmail';
  const hasFieldError = touched && error !== undefined;

  if (isMobile) {
    return (
      <div className={styles.field}>
        {isContactEmailField ? null : (
          <Text variant="label" as="label" htmlFor={field.key} className={styles.selectLabel}>
            {label}
          </Text>
        )}
        <input
          id={field.key}
          type={inputType}
          value={value === null || value === undefined ? '' : String(value)}
          placeholder={field.placeholder}
          aria-required={field.required ? true : undefined}
          aria-label={isContactEmailField ? field.label : undefined}
          className={resolveClassName(
            styles.nativeInput,
            touchClass,
            hasFieldError && styles.nativeInputError,
          )}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
        />
        {field.description !== undefined ? (
          <Text variant="caption" className={styles.selectHelper}>{field.description}</Text>
        ) : null}
      </div>
    );
  }

  return (
    <div className={styles.field}>
      <TextField
        label={isContactEmailField ? undefined : label}
        type={inputType}
        value={value === null || value === undefined ? '' : String(value)}
        placeholder={field.placeholder}
        helperText={field.description}
        isError={hasFieldError}
        aria-required={field.required ? true : undefined}
        aria-label={isContactEmailField ? field.label : undefined}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
      />
    </div>
  );
};
