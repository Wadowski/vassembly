import type { CommonError } from '@vassembly/errors';

export type SkillScriptLanguage = 'python' | 'nodejs' | 'bash';

export interface SkillScriptItem {
  filename: string;
  language: SkillScriptLanguage;
}

export interface SkillItem {
  id: string;
  specializationId: string;
  name: string;
  description: string;
  input: string;
  output: string;
  rule: string;
  enabled: boolean;
  scripts: SkillScriptItem[];
  usesSkillIds: string[];
  createdAt: string;
  updatedAt: string;
  removedAt: string | null;
}

export interface SkillListItem {
  id: string;
  specializationId: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface SkillScriptWriteInput {
  filename: string;
  language: SkillScriptLanguage;
  content: string;
}

export interface CreateSkillInput {
  specializationId: string;
  name: string;
  description: string;
  input: string;
  output: string;
  rule: string;
  scripts?: SkillScriptWriteInput[];
  usesSkillIds?: string[];
}

export interface UpdateSkillInput {
  description?: string;
  input?: string;
  output?: string;
  rule?: string;
  enabled?: boolean;
  scripts?: SkillScriptWriteInput[];
  usesSkillIds?: string[];
}

export interface SkillFormScriptInput {
  filename: string;
  language: SkillScriptLanguage;
  content: string;
}

export interface SkillFormInput {
  name: string;
  description: string;
  input: string;
  output: string;
  rule: string;
  scripts: SkillFormScriptInput[];
  usesSkillIds: string[];
}

export interface SkillCreateVariables {
  body: CreateSkillInput;
}

export interface SkillCreateMutationData {
  skill: SkillItem;
}

export interface SkillUpdateVariables {
  skillId: string;
  body: UpdateSkillInput;
}

export interface SkillUpdateMutationData {
  skill: SkillItem;
}

export interface SkillArchiveVariables {
  skillId: string;
}

export interface SkillArchiveMutationData {
  skill: SkillItem;
}

export interface SkillsBySpecializationResponse {
  items: SkillListItem[];
  total: number;
  page: number;
  size: number;
}

export interface UseSkillsBySpecializationArgs {
  specializationId: string;
  page?: number;
  size?: number;
  search?: string;
  skip?: boolean;
}

export interface UseSkillsBySpecializationResult {
  data?: SkillsBySpecializationResponse;
  loading: boolean;
  error?: Error;
  execute: (args: UseSkillsBySpecializationArgs) => Promise<void>;
}

export interface UseSkillArgs {
  skillId: string;
  skip?: boolean;
}

export interface UseSkillResult {
  data?: { skill: SkillItem | null };
  loading: boolean;
  error?: CommonError;
  refetch: () => void;
}
