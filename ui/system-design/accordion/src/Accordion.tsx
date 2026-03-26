import { resolveClassName } from '@vassembly/ui-utils';
import { AccordionRootContext } from './AccordionContext';
import styles from './Accordion.module.scss';
import type { AccordionProps, AccordionVariant } from './types';
import { useAccordionState } from './useAccordionState';

const VARIANT_MAP: Record<AccordionVariant, string> = {
  bordered: styles.variantBordered,
  default: styles.variantDefault,
  flush: styles.variantFlush,
};

export const Accordion = ({
  children,
  className,
  type = 'multiple',
  variant = 'default',
  ...rest
}: AccordionProps): JSX.Element => {
  const { contextValue, divProps } = useAccordionState({
    type,
    variant,
    ...rest,
  });

  const variantClassName = VARIANT_MAP[variant];

  return (
    <AccordionRootContext.Provider value={contextValue}>
      <div
        ref={contextValue.rootRef}
        className={resolveClassName(styles.root, variantClassName, className)}
        {...divProps}
      >
        {children}
      </div>
    </AccordionRootContext.Provider>
  );
};

Accordion.displayName = 'Accordion';
