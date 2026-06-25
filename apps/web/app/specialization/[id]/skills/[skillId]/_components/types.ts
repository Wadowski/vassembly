import type { SkillItem, SkillScriptItem, SkillScriptLanguage } from '@vassembly/ui-api-hooks';

export interface UseSkillDetailArgs {
  specializationId: string;
  skillId: string;
}

export interface UseSkillDetailResult {
  skill: SkillItem | undefined;
  specializationName: string | undefined;
  loading: boolean;
  error?: Error;
  isNotFound: boolean;
  activeScript: SkillScriptItem | null;
  setActiveScript: (script: SkillScriptItem) => void;
  scriptContent: string | null;
  scriptLoading: boolean;
  scriptError: string | null;
  handleRetry: () => void;
  handleScriptRetry: () => void;
}

export interface SkillDetailHeaderProps {
  specializationId: string;
  specializationName: string | undefined;
  skill: SkillItem;
}

export interface SkillRuleSectionProps {
  rule: string;
}

export interface SkillScriptsSectionProps {
  scripts: SkillScriptItem[];
  activeScript: SkillScriptItem | null;
  scriptContent: string | null;
  scriptLoading: boolean;
  scriptError: string | null;
  onSelectScript: (script: SkillScriptItem) => void;
  onScriptRetry: () => void;
}

export interface SkillScriptListProps {
  scripts: SkillScriptItem[];
  activeScript: SkillScriptItem | null;
  onSelectScript: (script: SkillScriptItem) => void;
}

export interface SkillCodeViewerProps {
  script: SkillScriptItem | null;
  content: string | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export type { SkillScriptLanguage };
