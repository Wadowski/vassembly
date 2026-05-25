import { AgentCategory, type AgentFormValues, type UseAgentFormResult } from '@vassembly/ui-api-hooks';

import { AGENT_DESCRIPTION_MAX, AGENT_NAME_MAX, AGENT_RULE_MAX } from './constants';
import { validatorFactory } from '@vassembly/validation';
import { useCallback, useMemo, useState } from 'react';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Name is required.').max(AGENT_NAME_MAX, `Name must be at most ${AGENT_NAME_MAX} characters.`),
  category: z.enum(Object.values(AgentCategory) as [AgentCategory, ...AgentCategory[]], {
    message: 'Category is required.',
  }),
  description: z
    .string()
    .min(1, 'Description is required.')
    .max(AGENT_DESCRIPTION_MAX, `Description must be at most ${AGENT_DESCRIPTION_MAX} characters.`),
  rule: z
    .string()
    .min(1, 'Rule is required.')
    .max(AGENT_RULE_MAX, `Rule must be at most ${AGENT_RULE_MAX} characters.`),
  integrationCredentialId: z.string(),
});

const validateAgentForm = validatorFactory(schema);

const toFormValues = (initial?: Partial<AgentFormValues>): AgentFormValues => ({
  name: initial?.name ?? '',
  category: initial?.category ?? '',
  description: initial?.description ?? '',
  rule: initial?.rule ?? '',
  integrationCredentialId: initial?.integrationCredentialId ?? null,
});

export const useAgentForm = (initial?: Partial<AgentFormValues>): UseAgentFormResult => {
  const [values, setValues] = useState<AgentFormValues>(() => toFormValues(initial));
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof AgentFormValues, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof AgentFormValues, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const shape = schema.shape;

  const isValid = useMemo(() => validateAgentForm(values).success, [values]);

  const getFieldErrorMessage = useCallback(
    (key: keyof AgentFormValues): string | undefined => {
      const message = fieldErrors[key];
      if (message === undefined) {
        return undefined;
      }
      if (!touched[key] && !submitAttempted) {
        return undefined;
      }
      return message;
    },
    [fieldErrors, submitAttempted, touched],
  );

  const setField = useCallback(<K extends keyof AgentFormValues>(key: K, value: AgentFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const blurField = useCallback(
    (key: keyof AgentFormValues) => {
      setTouched((prev) => ({ ...prev, [key]: true }));
      const fieldSchema = shape[key];
      const fieldResult = validatorFactory(fieldSchema)(values[key]);
      setFieldErrors((prev) => {
        const next = { ...prev };
        if (fieldResult.success) {
          delete next[key];
        } else {
          const first = fieldResult.error.error?.issues?.[0];
          next[key] = first?.message ?? 'Invalid value.';
        }
        return next;
      });
    },
    [shape, values],
  );

  const validate = useCallback((): boolean => {
    const result = validateAgentForm(values);
    if (result.success) {
      setFieldErrors({});
      setSubmitAttempted(false);
      return true;
    }
    setSubmitAttempted(true);
    const messages: Partial<Record<keyof AgentFormValues, string>> = {};
    for (const issue of result.error.error?.issues ?? []) {
      const path = issue.path[0];
      if (path === undefined) {
        continue;
      }
      const fieldKey = path as keyof AgentFormValues;
      if (messages[fieldKey] === undefined) {
        messages[fieldKey] = issue.message;
      }
    }
    setFieldErrors(messages);
    return false;
  }, [values]);

  const reset = useCallback((next?: Partial<AgentFormValues>) => {
    setValues(toFormValues(next));
    setFieldErrors({});
    setTouched({});
    setSubmitAttempted(false);
  }, []);

  return {
    values,
    fieldErrors,
    getFieldErrorMessage,
    descriptionCharCount: values.description.length,
    ruleCharCount: values.rule.length,
    isValid,
    setField,
    blurField,
    validate,
    reset,
  };
};
