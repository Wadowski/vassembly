import type { HTMLAttributes, ReactNode } from 'react';

export interface ComponentProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}
