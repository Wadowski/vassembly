import type { HTMLAttributes, ReactNode } from 'react';

export type TagVariant = 'default' | 'primary' | 'success' | 'warning' | 'error';
export type TagSize = 'small' | 'medium' | 'large';

export interface TagProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  children: ReactNode;
  variant?: TagVariant;
  size?: TagSize;
  onRemove?: () => void;
  removeLabel?: string;
  icon?: ReactNode;
  className?: string;
}

