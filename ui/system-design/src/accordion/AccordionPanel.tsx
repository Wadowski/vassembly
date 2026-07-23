import { useEffect, useRef } from 'react';
import { resolveClassName } from '@vassembly/ui-system-design/utils';
import { useAccordionItem, useAccordionRoot } from './AccordionContext';
import styles from './Accordion.module.scss';
import type { AccordionPanelProps } from './types';

export const AccordionPanel = ({
  children,
  className,
  ...rest
}: AccordionPanelProps): JSX.Element => {
  const regionRef = useRef<HTMLDivElement>(null);
  const { value } = useAccordionItem();
  const { getPanelId, getTriggerId, isOpen } = useAccordionRoot();
  const open = isOpen(value);
  const panelId = getPanelId(value);
  const triggerId = getTriggerId(value);

  useEffect(() => {
    const node = regionRef.current;
    if (!node) {
      return;
    }
    if (open) {
      node.removeAttribute('inert');
      return;
    }
    node.setAttribute('inert', '');
  }, [open]);

  return (
    <div
      className={resolveClassName(styles.panel, open ? styles.panelOpen : undefined, className)}
      data-expanded={open}
      {...rest}
    >
      <div className={styles.panelInner}>
        <div
          ref={regionRef}
          id={panelId}
          aria-hidden={!open}
          aria-labelledby={triggerId}
          className={styles.panelRegion}
          role="region"
        >
          {children}
        </div>
      </div>
    </div>
  );
};

AccordionPanel.displayName = 'AccordionPanel';
