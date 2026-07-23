import { useCallback, type KeyboardEvent } from 'react';
import { useAccordionItem, useAccordionRoot } from './AccordionContext';
import type { AccordionTriggerProps } from './types';

export const useAccordionTrigger = (args: {
  onKeyDown?: AccordionTriggerProps['onKeyDown'];
}): {
  disabled: boolean;
  value: string;
  open: boolean;
  triggerId: string;
  panelId: string;
  handleKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
  toggle: (itemValue: string) => void;
} => {
  const { onKeyDown } = args;
  const { disabled, value } = useAccordionItem();
  const { getPanelId, getTriggerId, isOpen, rootRef, toggle, type } = useAccordionRoot();
  const open = isOpen(value);
  const triggerId = getTriggerId(value);
  const panelId = getPanelId(value);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>): void => {
      onKeyDown?.(event);
      if (event.defaultPrevented) {
        return;
      }
      if (type !== 'single') {
        return;
      }
      const root = rootRef.current;
      if (!root) {
        return;
      }
      const triggers = [
        ...root.querySelectorAll<HTMLButtonElement>(
          'button[data-accordion-trigger]:not([disabled])',
        ),
      ];
      const index = triggers.indexOf(event.currentTarget);
      if (index === -1) {
        return;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        triggers[(index + 1) % triggers.length]?.focus();
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        triggers[(index - 1 + triggers.length) % triggers.length]?.focus();
        return;
      }
      if (event.key === 'Home') {
        event.preventDefault();
        triggers[0]?.focus();
        return;
      }
      if (event.key === 'End') {
        event.preventDefault();
        triggers[triggers.length - 1]?.focus();
      }
    },
    [onKeyDown, rootRef, type],
  );

  return {
    disabled,
    value,
    open,
    triggerId,
    panelId,
    handleKeyDown,
    toggle,
  };
};
