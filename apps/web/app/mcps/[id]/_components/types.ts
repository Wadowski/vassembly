import type { RefObject } from 'react';

import type { McpConfigSchemaField, McpConfiguration, McpDetail } from '@vassembly/ui-api-hooks';

export interface McpDetailHeaderProps {
  mcp: McpDetail;
  configuration?: McpConfiguration | null;
}

export interface McpConfigFormProps {
  mcp: McpDetail;
  savedConfiguration?: McpConfiguration | null;
}

export interface McpConfigFieldProps {
  field: McpConfigSchemaField;
  value: string | boolean;
  error?: string;
  touched: boolean;
  isMobile: boolean;
  hasSavedSecret?: boolean;
  onChange: (value: string | boolean) => void;
  onBlur: () => void;
}

export interface McpSecretFieldProps {
  field: McpConfigSchemaField;
  value: string;
  hasSavedSecret: boolean;
  error?: string;
  touched: boolean;
  isMobile: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
}

export interface McpRemoveConfigModalProps {
  open: boolean;
  mcpName: string;
  agentUsageCount?: number;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

export interface McpDiscardChangesModalProps {
  open: boolean;
  onStay: () => void;
  onDiscard: () => void;
  returnFocusRef: RefObject<HTMLButtonElement>;
}
