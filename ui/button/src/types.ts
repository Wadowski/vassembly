import type React from 'react';

export type ButtonColor = 'primary' | 'secondary' | 'tertiary' | 'danger';

export type ButtonVariant = 'contained' | 'outlined' | 'text';

export type ButtonSize = 'small' | 'medium' | 'large';

export type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement> & { className?: string }>;

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  text: React.ReactNode;
  color?: ButtonColor;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isDisabled?: boolean;
  isLoading?: boolean;
  isFullWidth?: boolean;
  icon?: IconComponent | React.ReactNode;
  iconPosition?: 'left' | 'right';
}
