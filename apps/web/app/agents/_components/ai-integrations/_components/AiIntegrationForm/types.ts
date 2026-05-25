import type { Dispatch, FormEvent, SetStateAction } from 'react';

import type { AiIntegrationFormInput } from '@vassembly/ui-api-hooks';

export interface UseAiIntegrationFormOptions {
  initialValues?: Partial<AiIntegrationFormInput>;
  mode?: 'create' | 'edit';
  onSubmit?: (values: AiIntegrationFormInput) => Promise<void>;
}

export interface UseAiIntegrationFormResult {
  values: AiIntegrationFormInput;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  handleChange: <K extends keyof AiIntegrationFormInput>(field: K, value: AiIntegrationFormInput[K]) => void;
  handleBlur: (field: keyof AiIntegrationFormInput) => void;
  handleSubmit: (event?: FormEvent) => Promise<void>;
  validate: () => boolean;
  setValues: Dispatch<SetStateAction<AiIntegrationFormInput>>;
}
