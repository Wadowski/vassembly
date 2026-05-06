import type { ReactNode } from 'react';

export type CheckboxChecked = boolean | 'indeterminate';
export type CheckboxSize = 'small' | 'medium' | 'large';
export type CheckboxVariant = 'default' | 'error' | 'success';
export type CheckboxLabelPosition = 'left' | 'right';

export interface CheckboxProps {
  checked: CheckboxChecked;
  onCheckedChange?: (next: CheckboxChecked) => void;
  label?: ReactNode;
  description?: string;
  errorMessage?: string;
  labelPosition?: CheckboxLabelPosition;
  size?: CheckboxSize;
  variant?: CheckboxVariant;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
}

export interface CheckboxLabelProps {
  label?: ReactNode;
  labelId: string;
  isRequired: boolean;
  onClick: () => void;
}
