import type { McpConfigurationStatus, McpListItem as McpListItemDto } from '@vassembly/ui-api-hooks';

import type { McpStatusBadgeVariant } from '../McpStatusBadge/types';

export interface McpListItemProps {
  mcp: McpListItemDto & { configurationStatus?: McpConfigurationStatus };
  statusBadge?: McpStatusBadgeVariant;
  iconSize?: number;
  isTitleAriaHidden?: boolean;
}
