export interface InternalToolItem {
  id: string;
  displayName: string;
  description: string;
}

export interface InternalToolAssignmentPickerProps {
  value: string[];
  onChange: (value: string[]) => void;
  tools: InternalToolItem[];
  isLoading?: boolean;
  errorMessage?: string;
  isDisabled?: boolean;
  label?: string;
  helperText?: string;
}
