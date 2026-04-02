import { forwardRef, type ElementType } from 'react';
import { resolveClassName } from '@vassembly/ui-utils';
import styles from './Text.module.scss';
import type { TextProps, TextVariant } from './types';

const VARIANT_MAP: Record<TextVariant, string> = {
  h1: styles.variantH1,
  h2: styles.variantH2,
  h3: styles.variantH3,
  body1: styles.variantBody1,
  body2: styles.variantBody2,
  label: styles.variantLabel,
  caption: styles.variantCaption,
};

const DEFAULT_ELEMENT_MAP: Record<TextVariant, string> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  body1: 'p',
  body2: 'p',
  label: 'span',
  caption: 'span',
};

export const Text = forwardRef<HTMLElement, TextProps>(
  ({ variant = 'body1', as, className, children, ...props }, ref) => {
    const Tag = (as ?? DEFAULT_ELEMENT_MAP[variant]) as ElementType;

    const textClassName = resolveClassName(styles.text, VARIANT_MAP[variant], className);

    return (
      <Tag ref={ref} className={textClassName} {...props}>
        {children}
      </Tag>
    );
  },
);

Text.displayName = 'Text';
