export type SwitchSize = 'small' | 'medium' | 'large';

export interface SwitchProps {
  isChecked?: boolean;
  onChange?: (isChecked: boolean) => void;
  size?: SwitchSize;
  label?: string;
  helperText?: string;
  errorMessage?: string;
  isError?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isLoading?: boolean;
  id?: string;
  className?: string;
}
