export interface McpAgentsSectionProps {
  mcpId: string;
  mcpName: string;
}

export interface McpAgentListItemProps {
  agentId: string;
  agentName: string;
  category: string;
  editHref: string;
  isRemoving: boolean;
  onRemove: (agentId: string) => void;
  onEdit: (editHref: string) => void;
}

export interface McpUnassignAgentModalProps {
  open: boolean;
  mcpName: string;
  agentName: string;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export interface McpAgentsUnassignTarget {
  agentId: string;
  agentName: string;
}
