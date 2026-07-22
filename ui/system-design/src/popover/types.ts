import type { ReactNode } from 'react';

export type PopoverPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface PopoverProps {
  trigger: ReactNode;
  children: ReactNode;
  placement?: PopoverPlacement;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  className?: string;
  triggerClassName?: string;
}
