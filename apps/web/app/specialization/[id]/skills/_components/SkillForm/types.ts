import type { SkillFormInput, SkillFormScriptInput, SkillScriptLanguage } from '@vassembly/ui-api-hooks';

import type { UseSkillFormResult } from './useSkillForm';

export const SkillFormMode = {
  Create: 'create',
  Edit: 'edit',
} as const;

export type SkillFormModeValue = (typeof SkillFormMode)[keyof typeof SkillFormMode];

export interface SkillFormProps {
  mode: SkillFormModeValue;
  form: UseSkillFormResult;
  isSubmitting?: boolean;
  submitError?: string;
  onSubmit: () => void;
  onCancel: () => void;
}

export interface SkillFormInitialValues {
  name?: string;
  description?: string;
  rule?: string;
  scripts?: SkillFormScriptInput[];
}

export type { SkillFormInput, SkillFormScriptInput, SkillScriptLanguage };
