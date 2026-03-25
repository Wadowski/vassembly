import { className as cn } from '@vassembly/ui-utils';
import { AccordionItemContext } from './AccordionContext';
import styles from './Accordion.module.scss';
import type { AccordionItemProps } from './types';

export const AccordionItem = ({
  children,
  className,
  disabled = false,
  value,
  ...rest
}: AccordionItemProps): JSX.Element => {
  return (
    <AccordionItemContext.Provider value={{ disabled, value }}>
      <div
        className={cn(styles.item, disabled ? styles.itemDisabled : undefined, className)}
        {...rest}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
};

AccordionItem.displayName = 'AccordionItem';
