import type { InternalToolContext } from '../types';

export interface NormalizedQuestionInput {
  question: string;
  inputType?: 'text' | 'select' | 'multiselect' | 'boolean';
  options?: string[];
  schema?: Record<string, unknown>;
}

export interface AskUserQuestionInput {
  question: string;
  input_type?: 'text' | 'select' | 'multiselect' | 'boolean';
  options?: string[];
  schema?: Record<string, unknown>;
}

export interface AskUserArgs {
  question?: string;
  input_type?: 'text' | 'select' | 'multiselect' | 'boolean';
  options?: string[];
  schema?: Record<string, unknown>;
  questions?: AskUserQuestionInput[];
}

export interface AskUserParams {
  args: Record<string, unknown>;
  context: InternalToolContext;
}

export interface NormalizeAskUserArgsParams {
  args: Record<string, unknown>;
}

export interface NormalizeAskUserArgsResult {
  questions: NormalizedQuestionInput[];
}
