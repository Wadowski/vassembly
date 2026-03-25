import type { ElementType, HTMLAttributes, ReactNode } from 'react';

export type TextVariant = 'h1' | 'h2' | 'h3' | 'body1' | 'body2' | 'label' | 'caption';

export interface TextProps extends HTMLAttributes<HTMLElement> {
  variant?: TextVariant;
  as?: ElementType;
  htmlFor?: string;
  children: ReactNode;
}
