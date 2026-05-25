export interface IntegrationCredentialOption {
  id: string;
  name: string;
  provider: string;
}

export interface IntegrationCredentialPickerProps {
  value?: string | null;
  onChange: (value: string | null) => void;
  credentials: IntegrationCredentialOption[];
  isLoading?: boolean;
  errorMessage?: string;
  isDisabled?: boolean;
  label?: string;
  helperText?: string;
  manageHref?: string;
  manageLabel?: string;
}
