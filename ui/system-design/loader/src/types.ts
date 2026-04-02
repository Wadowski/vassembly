import type { HTMLAttributes, ReactNode } from 'react';

export type LoaderProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'role' | 'aria-label'
> & {
  ariaLabel?: string;
  children?: ReactNode;
};
