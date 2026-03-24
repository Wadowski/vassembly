import type React from 'react';

export type TextFieldVariant = 'outlined' | 'filled';

export type TextFieldSize = 'small' | 'medium' | 'large';

export interface TextFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  variant?: TextFieldVariant;
  size?: TextFieldSize;
  isFullWidth?: boolean;
  label?: string;
  helperText?: string;
  errorMessage?: string;
  isError?: boolean;
  isSuccess?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isMultiline?: boolean;
  minRows?: number;
  leadingIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>> | React.ReactNode;
  trailingIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>> | React.ReactNode;
  prefixText?: string;
  suffixText?: string;
}
