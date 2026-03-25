import { className as cn } from '@vassembly/ui-utils';
import styles from './Accordion.module.scss';
import type { AccordionTriggerProps } from './types';
import { useAccordionTrigger } from './useAccordionTrigger';

export const AccordionTrigger = ({
  children,
  className,
  onClick,
  onKeyDown,
  ...rest
}: AccordionTriggerProps): JSX.Element => {
  const { disabled, value, open, triggerId, panelId, handleKeyDown, toggle } = useAccordionTrigger({
    onKeyDown,
  });

  return (
    <button
      {...rest}
      type="button"
      id={triggerId}
      data-accordion-trigger
      className={cn(styles.trigger, open ? styles.triggerExpanded : undefined, className)}
      aria-controls={panelId}
      aria-expanded={open}
      disabled={disabled}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || disabled) {
          return;
        }
        toggle(value);
      }}
      onKeyDown={handleKeyDown}
    >
      <span className={styles.triggerInner}>
        <span className={styles.triggerLabel}>{children}</span>
        <span className={styles.chevron} aria-hidden="true" />
      </span>
    </button>
  );
};

AccordionTrigger.displayName = 'AccordionTrigger';
