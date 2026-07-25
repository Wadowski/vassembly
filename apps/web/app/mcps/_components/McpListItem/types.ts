import type { McpConfigurationStatus, McpListItem as McpListItemDto } from '@vassembly/ui-api-hooks';

import type { McpStatusBadgeVariant } from '../McpStatusBadge/types';

export interface McpListItemProps {
  mcp: McpListItemDto & {
    configurationStatus?: McpConfigurationStatus;
    enabled?: boolean;
    requiresConfiguration?: boolean;
  };
  statusBadge?: McpStatusBadgeVariant;
  iconSize?: number;
  isToggleLoading?: boolean;
  onToggleEnabled?: (params: { mcpId: string; enabled: boolean }) => Promise<boolean>;
}
