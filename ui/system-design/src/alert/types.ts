import type { ReactNode } from 'react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps {
  message: ReactNode;
  variant?: AlertVariant;
  showIcon?: boolean;
  icon?: ReactNode;
  details?: ReactNode;
  isCollapsible?: boolean;
  defaultIsExpanded?: boolean;
  isExpanded?: boolean;
  onExpandedChange?: (isExpanded: boolean) => void;
  className?: string;
}
