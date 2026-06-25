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
  rule: string;
  scripts: SkillScriptItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SkillListItem {
  id: string;
  specializationId: string;
  name: string;
  description: string;
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
