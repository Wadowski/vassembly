import { ArrowDownIcon } from '@vassembly/ui-system-design/icons';
import { resolveClassName } from '@vassembly/ui-system-design/utils';
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
      className={resolveClassName(styles.trigger, className)}
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
        <span aria-hidden="true">
          <ArrowDownIcon
            className={resolveClassName(styles.chevron, open && styles.chevronOpen)}
          />
        </span>
      </span>
    </button>
  );
};

AccordionTrigger.displayName = 'AccordionTrigger';
