export interface McpAssignmentOption {
  id: string;
  name: string;
  slug: string;
}

export interface McpAssignmentPickerProps {
  value: string[];
  onChange: (value: string[]) => void;
  configuredMcps: McpAssignmentOption[];
  isLoading?: boolean;
  errorMessage?: string;
  isDisabled?: boolean;
  label?: string;
  helperText?: string;
  manageHref?: string;
  manageLabel?: string;
}
