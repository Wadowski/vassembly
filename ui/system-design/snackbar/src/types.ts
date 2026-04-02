import type { ReactNode } from 'react';

export type SnackbarVariant = 'info' | 'success' | 'warning' | 'error';

export type SnackbarPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface SnackbarItem {
  id: string;
  message: string;
  variant?: SnackbarVariant;
  duration?: number;
  isDismissible?: boolean;
}

export interface SnackbarContextValue {
  show: (item: Omit<SnackbarItem, 'id'>) => void;
  dismiss: (id: string) => void;
}

export interface SnackbarProps {
  message: string;
  variant?: SnackbarVariant;
  isDismissible?: boolean;
  onDismiss?: () => void;
}

export interface SnackbarProviderProps {
  children: ReactNode;
  position?: SnackbarPosition;
  maxVisible?: number;
}

