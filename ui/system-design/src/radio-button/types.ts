export type RadioButtonSize = 'small' | 'medium' | 'large';
export type RadioButtonVariant = 'default' | 'error' | 'success';
export type RadioButtonLabelPosition = 'left' | 'right';

export interface RadioButtonProps {
  checked: boolean;
  onCheckedChange?: (next: boolean) => void;
  label?: string;
  description?: string;
  errorMessage?: string;
  labelPosition?: RadioButtonLabelPosition;
  size?: RadioButtonSize;
  variant?: RadioButtonVariant;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
}

export interface RadioButtonOption {
  value: string;
  label?: string;
  description?: string;
  isDisabled?: boolean;
}

export type RadioButtonGroupDirection = 'horizontal' | 'vertical';

export interface RadioButtonGroupProps {
  value: string;
  onChange: (value: string) => void;
  options: RadioButtonOption[];
  label?: string;
  description?: string;
  errorMessage?: string;
  size?: RadioButtonSize;
  variant?: RadioButtonVariant;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
  labelPosition?: RadioButtonLabelPosition;
  direction?: RadioButtonGroupDirection;
}
