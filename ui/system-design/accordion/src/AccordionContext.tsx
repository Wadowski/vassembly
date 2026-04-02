import { createContext, useContext } from 'react';
import type { RefObject } from 'react';
import type { AccordionType, AccordionVariant } from './types';

export type AccordionRootContextValue = {
  getPanelId: (itemValue: string) => string;
  getTriggerId: (itemValue: string) => string;
  isOpen: (itemValue: string) => boolean;
  rootRef: RefObject<HTMLDivElement>;
  toggle: (itemValue: string) => void;
  type: AccordionType;
  variant: AccordionVariant;
};

const AccordionRootContext = createContext<AccordionRootContextValue | null>(null);

export type AccordionItemContextValue = {
  disabled: boolean;
  value: string;
};

const AccordionItemContext = createContext<AccordionItemContextValue | null>(null);

export const useAccordionRoot = (): AccordionRootContextValue => {
  const context = useContext(AccordionRootContext);
  if (!context) {
    throw new Error('Accordion subcomponents must be used within Accordion');
  }
  return context;
};

export const useAccordionItem = (): AccordionItemContextValue => {
  const context = useContext(AccordionItemContext);
  if (!context) {
    throw new Error('AccordionTrigger and AccordionPanel must be used within AccordionItem');
  }
  return context;
};

export { AccordionItemContext, AccordionRootContext };
