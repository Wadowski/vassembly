import type { SystemAgentFormInput } from '@vassembly/ui-api-hooks';
import { SystemAgentCategory } from '@vassembly/ui-api-hooks';
import { getValidatorIssues, validatorFactory } from '@vassembly/validation';
import { useCallback, useMemo, useState } from 'react';
import { z } from 'zod';

import {
  SYSTEM_AGENT_DESCRIPTION_MAX,
  SYSTEM_AGENT_NAME_MAX,
  SYSTEM_AGENT_RULE_MAX,
} from './constants';
import type { SystemAgentFormValues, UseSystemAgentFormResult } from './types';

const categoryValues = Object.values(SystemAgentCategory) as [SystemAgentCategory, ...SystemAgentCategory[]];

const schema = z.object({
  name: z
    .string()
    .min(1, 'Name is required.')
    .max(SYSTEM_AGENT_NAME_MAX, `Name must be at most ${SYSTEM_AGENT_NAME_MAX} characters.`),
  category: z.enum(categoryValues, { message: 'Select a valid category.' }),
  description: z
    .string()
    .max(
      SYSTEM_AGENT_DESCRIPTION_MAX,
      `Description must be at most ${SYSTEM_AGENT_DESCRIPTION_MAX} characters.`,
    )
    .optional(),
  rule: z
    .string()
    .min(1, 'Prompt is required.')
    .max(SYSTEM_AGENT_RULE_MAX, `Prompt must not exceed ${SYSTEM_AGENT_RULE_MAX} characters.`),
});

const validateForm = validatorFactory(schema);

const toFormValues = (initial?: Partial<SystemAgentFormValues>): SystemAgentFormValues => ({
  name: initial?.name ?? '',
  category: initial?.category ?? '',
  description: initial?.description ?? '',
  rule: initial?.rule ?? '',
});

export const useSystemAgentForm = (initial?: Partial<SystemAgentFormValues>): UseSystemAgentFormResult => {
  const [values, setValues] = useState<SystemAgentFormValues>(() => toFormValues(initial));
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof SystemAgentFormValues, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof SystemAgentFormValues, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const shape = schema.shape;

  const isValid = useMemo(() => validateForm(values).success, [values]);

  const getFieldErrorMessage = useCallback(
    (key: keyof SystemAgentFormValues): string | undefined => {
      const message = fieldErrors[key];
      if (message === undefined || (!touched[key] && !submitAttempted)) {
        return undefined;
      }
      return message;
    },
    [fieldErrors, submitAttempted, touched],
  );

  const setField = useCallback(<K extends keyof SystemAgentFormValues>(key: K, value: SystemAgentFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const blurField = useCallback(
    (key: keyof SystemAgentFormValues) => {
      setTouched((prev) => ({ ...prev, [key]: true }));
      const fieldResult = validatorFactory(shape[key])(values[key]);
      setFieldErrors((prev) => {
        const next = { ...prev };
        if (fieldResult.success) {
          delete next[key];
        } else {
          const first = getValidatorIssues(fieldResult)[0];
          next[key] = first?.message ?? 'Invalid value.';
        }
        return next;
      });
    },
    [shape, values],
  );

  const validate = useCallback((): boolean => {
    const result = validateForm(values);
    if (result.success) {
      setFieldErrors({});
      setSubmitAttempted(false);
      return true;
    }
    setSubmitAttempted(true);
    const messages: Partial<Record<keyof SystemAgentFormValues, string>> = {};
    for (const issue of getValidatorIssues(result)) {
      const path = issue.path[0];
      if (path === undefined) {
        continue;
      }
      const fieldKey = path as keyof SystemAgentFormValues;
      if (messages[fieldKey] === undefined) {
        messages[fieldKey] = issue.message;
      }
    }
    setFieldErrors(messages);
    return false;
  }, [values]);

  const reset = useCallback((next?: Partial<SystemAgentFormValues>) => {
    setValues(toFormValues(next));
    setFieldErrors({});
    setTouched({});
    setSubmitAttempted(false);
  }, []);

  const toSubmitInput = useCallback((): SystemAgentFormInput => {
    const description = values.description.trim();
    return {
      name: values.name.trim(),
      rule: values.rule.trim(),
      category: values.category === '' ? undefined : values.category,
      ...(description !== '' ? { description } : {}),
    };
  }, [values]);

  return {
    values,
    getFieldErrorMessage,
    descriptionCharCount: values.description.length,
    ruleCharCount: values.rule.length,
    isValid,
    setField,
    blurField,
    validate,
    reset,
    toSubmitInput,
  };
};
