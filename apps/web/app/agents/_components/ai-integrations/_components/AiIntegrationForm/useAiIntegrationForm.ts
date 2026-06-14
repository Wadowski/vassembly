import { useCallback, useMemo, useState } from 'react';
import type { FormEvent } from 'react';

import type { AiIntegrationFormInput } from '@vassembly/ui-api-hooks';

import { getValidatorIssues } from '@vassembly/validation';
import type { z } from 'zod';

import {
  createValidateAiIntegrationForm,
  toAiIntegrationFormValues,
} from './formSchema';
import type { UseAiIntegrationFormOptions, UseAiIntegrationFormResult } from './types';

interface CollectFieldErrorsParams {
  issues: z.ZodIssue[];
}

const collectFieldErrors = ({ issues }: CollectFieldErrorsParams): Record<string, string> => {
  const messages: Record<string, string> = {};
  for (const issue of issues) {
    const field = issue.path[0];
    if (typeof field === 'string' && messages[field] === undefined) {
      messages[field] = issue.message;
    }
  }
  return messages;
};

export const useAiIntegrationForm = ({
  mode = 'create',
  initialValues,
  onSubmit,
}: UseAiIntegrationFormOptions = {}): UseAiIntegrationFormResult => {
  const [values, setValues] = useState<AiIntegrationFormInput>(() => toAiIntegrationFormValues(initialValues));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = useMemo(() => createValidateAiIntegrationForm(mode), [mode]);

  const handleChange = useCallback<UseAiIntegrationFormResult['handleChange']>((field, value) => {
    setValues((prev: AiIntegrationFormInput) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const fieldKey = String(field);
      if (prev[fieldKey] === undefined) {
        return prev;
      }
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
  }, []);

  const handleBlur = useCallback(
    (field: keyof AiIntegrationFormInput) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      const result = validateForm(values);
      const fieldKey = String(field);
      if (result.success) {
        setErrors((prev) => {
          if (prev[fieldKey] === undefined) {
            return prev;
          }
          const next = { ...prev };
          delete next[fieldKey];
          return next;
        });
        return;
      }
      const fieldErrors = collectFieldErrors({ issues: getValidatorIssues(result) });
      setErrors((prev) => ({
        ...prev,
        ...(fieldErrors[fieldKey] !== undefined ? { [fieldKey]: fieldErrors[fieldKey] } : {}),
      }));
    },
    [validateForm, values],
  );

  const validate = useCallback((): boolean => {
    const result = validateForm(values);
    if (result.success) {
      setErrors({});
      return true;
    }
    const fieldErrors = collectFieldErrors({ issues: getValidatorIssues(result) });
    setErrors(fieldErrors);
    setTouched((prev) => {
      const next = { ...prev };
      for (const field of Object.keys(fieldErrors)) {
        next[field] = true;
      }
      return next;
    });
    return false;
  }, [validateForm, values]);

  const handleSubmit = useCallback(
    async (event?: FormEvent): Promise<void> => {
      event?.preventDefault();
      if (!validate()) {
        return;
      }
      if (onSubmit === undefined) {
        return;
      }
      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, validate, values],
  );

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    validate,
    setValues,
  };
};
