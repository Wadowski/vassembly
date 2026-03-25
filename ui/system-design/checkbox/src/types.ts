export type CheckboxChecked = boolean | 'indeterminate';
export type CheckboxSize = 'small' | 'medium' | 'large';
export type CheckboxVariant = 'default' | 'error' | 'success';
export type CheckboxLabelPosition = 'left' | 'right';

export interface CheckboxProps {
  checked: CheckboxChecked;
  onCheckedChange?: (next: CheckboxChecked) => void;
  label?: string;
  description?: string;
  errorMessage?: string;
  labelPosition?: CheckboxLabelPosition;
  size?: CheckboxSize;
  variant?: CheckboxVariant;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
}
