'use client';

import type { SkillFormInput, SkillFormScriptInput } from '@vassembly/ui-api-hooks';
import { getValidatorIssues, validatorFactory } from '@vassembly/validation';
import { useCallback, useMemo, useState } from 'react';
import { z } from 'zod';

import {
  SKILL_DESCRIPTION_MAX,
  SKILL_NAME_MAX,
  SKILL_RULE_MAX,
  SKILL_SCRIPT_MAX_COUNT,
} from './constants';
import type { SkillFormInitialValues } from './types';

const scriptLanguageSchema = z.enum(['python', 'nodejs', 'bash']);

const scriptSchema = z.object({
  filename: z.string().trim().min(1, 'Filename is required.'),
  language: scriptLanguageSchema,
  content: z.string(),
});

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required.')
    .max(SKILL_NAME_MAX, `Name must be at most ${SKILL_NAME_MAX} characters.`),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required.')
    .max(
      SKILL_DESCRIPTION_MAX,
      `Description must be at most ${SKILL_DESCRIPTION_MAX} characters.`,
    ),
  rule: z
    .string()
    .trim()
    .min(1, 'Rule is required.')
    .max(SKILL_RULE_MAX, `Rule must be at most ${SKILL_RULE_MAX} characters.`),
  usesSkillIds: z.array(z.string().trim().min(1)),
  scripts: z
    .array(scriptSchema)
    .max(SKILL_SCRIPT_MAX_COUNT, `At most ${SKILL_SCRIPT_MAX_COUNT} scripts are allowed.`),
});

const validateForm = validatorFactory(schema);

const emptyScript = (): SkillFormScriptInput => ({
  filename: '',
  language: 'python',
  content: '',
});

const toFormValues = (initial?: SkillFormInitialValues): SkillFormInput => ({
  name: initial?.name ?? '',
  description: initial?.description ?? '',
  rule: initial?.rule ?? '',
  usesSkillIds: initial?.usesSkillIds ?? [],
  scripts: initial?.scripts ?? [],
});

export interface UseSkillFormResult {
  values: SkillFormInput;
  isValid: boolean;
  setField: <K extends keyof SkillFormInput>(key: K, value: SkillFormInput[K]) => void;
  addScript: () => void;
  removeScript: (index: number) => void;
  updateScript: (index: number, script: Partial<SkillFormScriptInput>) => void;
  validate: () => boolean;
  reset: (initial?: SkillFormInitialValues) => void;
  getFieldErrorMessage: (key: keyof SkillFormInput) => string | undefined;
  getScriptFieldErrorMessage: (
    index: number,
    key: keyof SkillFormScriptInput,
  ) => string | undefined;
  blurField: (key: keyof SkillFormInput) => void;
  descriptionCharCount: number;
  ruleCharCount: number;
}

export const useSkillForm = (initial?: SkillFormInitialValues): UseSkillFormResult => {
  const [values, setValues] = useState<SkillFormInput>(() => toFormValues(initial));
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof SkillFormInput, string>>>(
    {},
  );
  const [scriptFieldErrors, setScriptFieldErrors] = useState<
    Record<number, Partial<Record<keyof SkillFormScriptInput, string>>>
  >({});
  const [touched, setTouched] = useState<Partial<Record<keyof SkillFormInput, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const isValid = useMemo(() => validateForm(values).success, [values]);

  const getFieldErrorMessage = useCallback(
    (key: keyof SkillFormInput): string | undefined => {
      const message = fieldErrors[key];

      if (message === undefined || (!touched[key] && !submitAttempted)) {
        return undefined;
      }

      return message;
    },
    [fieldErrors, submitAttempted, touched],
  );

  const getScriptFieldErrorMessage = useCallback(
    (index: number, key: keyof SkillFormScriptInput): string | undefined => {
      const message = scriptFieldErrors[index]?.[key];

      if (message === undefined || !submitAttempted) {
        return undefined;
      }

      return message;
    },
    [scriptFieldErrors, submitAttempted],
  );

  const setField = useCallback(<K extends keyof SkillFormInput>(key: K, value: SkillFormInput[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const addScript = useCallback((): void => {
    setValues((prev) => {
      if (prev.scripts.length >= SKILL_SCRIPT_MAX_COUNT) {
        return prev;
      }

      return {
        ...prev,
        scripts: [...prev.scripts, emptyScript()],
      };
    });
  }, []);

  const removeScript = useCallback((index: number): void => {
    setValues((prev) => ({
      ...prev,
      scripts: prev.scripts.filter((_, scriptIndex) => scriptIndex !== index),
    }));
    setScriptFieldErrors((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  }, []);

  const updateScript = useCallback((index: number, script: Partial<SkillFormScriptInput>): void => {
    setValues((prev) => ({
      ...prev,
      scripts: prev.scripts.map((existing, scriptIndex) =>
        scriptIndex === index ? { ...existing, ...script } : existing,
      ),
    }));
  }, []);

  const reset = useCallback((nextInitial?: SkillFormInitialValues): void => {
    setValues(toFormValues(nextInitial));
    setFieldErrors({});
    setScriptFieldErrors({});
    setTouched({});
    setSubmitAttempted(false);
  }, []);

  const validate = useCallback((): boolean => {
    setSubmitAttempted(true);
    const result = validateForm(values);

    if (result.success) {
      setFieldErrors({});
      setScriptFieldErrors({});
      return true;
    }

    const issues = getValidatorIssues(result);
    const nextFieldErrors: Partial<Record<keyof SkillFormInput, string>> = {};
    const nextScriptErrors: Record<number, Partial<Record<keyof SkillFormScriptInput, string>>> = {};

    for (const issue of issues) {
      const path = issue.path;

      if (path[0] === 'scripts' && typeof path[1] === 'number') {
        const scriptIndex = path[1];
        const scriptKey = path[2];

        if (typeof scriptKey === 'string') {
          nextScriptErrors[scriptIndex] = {
            ...nextScriptErrors[scriptIndex],
            [scriptKey]: issue.message,
          };
        }

        continue;
      }

      const fieldKey = path[0];

      if (typeof fieldKey === 'string' && fieldKey in values) {
        nextFieldErrors[fieldKey as keyof SkillFormInput] = issue.message;
      }
    }

    setFieldErrors(nextFieldErrors);
    setScriptFieldErrors(nextScriptErrors);
    return false;
  }, [values]);

  const blurField = useCallback((key: keyof SkillFormInput): void => {
    setTouched((prev) => ({ ...prev, [key]: true }));
  }, []);

  return {
    values,
    isValid,
    setField,
    addScript,
    removeScript,
    updateScript,
    validate,
    reset,
    getFieldErrorMessage,
    getScriptFieldErrorMessage,
    blurField,
    descriptionCharCount: values.description.length,
    ruleCharCount: values.rule.length,
  };
};
