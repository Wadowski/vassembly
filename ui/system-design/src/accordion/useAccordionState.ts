import type { HTMLAttributes } from 'react';
import { useCallback, useId, useMemo, useRef, useState } from 'react';
import type { AccordionRootContextValue } from './AccordionContext';
import type {
  AccordionMultipleProps,
  AccordionProps,
  AccordionSingleProps,
} from './types';

export type UseAccordionStateArgs = Omit<AccordionProps, 'children' | 'className'>;

export type UseAccordionStateResult = {
  contextValue: AccordionRootContextValue;
  divProps: HTMLAttributes<HTMLDivElement>;
};

export const useAccordionState = ({
  type = 'multiple',
  variant = 'default',
  ...rest
}: UseAccordionStateArgs): UseAccordionStateResult => {
  const rootRef = useRef<HTMLDivElement>(null);
  const baseId = useId();
  const isMultiple = type === 'multiple';

  const multiRest = rest as AccordionMultipleProps;
  const singleRest = rest as AccordionSingleProps;

  const [internalMulti, setInternalMulti] = useState<string[]>(() =>
    isMultiple ? multiRest.defaultValue ?? [] : [],
  );
  const [internalSingle, setInternalSingle] = useState<string | null>(() =>
    !isMultiple ? singleRest.defaultValue ?? null : null,
  );

  const expandedMulti = isMultiple ? (multiRest.value ?? internalMulti) : [];
  const expandedSingle = !isMultiple
    ? singleRest.value !== undefined
      ? singleRest.value
      : internalSingle
    : null;

  const isOpen = useCallback(
    (itemValue: string): boolean => {
      if (isMultiple) {
        return expandedMulti.includes(itemValue);
      }
      return expandedSingle === itemValue;
    },
    [expandedMulti, expandedSingle, isMultiple],
  );

  const toggle = useCallback(
    (itemValue: string): void => {
      if (isMultiple) {
        const previous = multiRest.value ?? internalMulti;
        const next = previous.includes(itemValue)
          ? previous.filter((v) => v !== itemValue)
          : [...previous, itemValue];
        if (multiRest.value === undefined) {
          setInternalMulti(next);
        }
        multiRest.onValueChange?.(next);
        return;
      }
      const previous =
        singleRest.value !== undefined ? singleRest.value : internalSingle;
      const next = previous === itemValue ? null : itemValue;
      if (singleRest.value === undefined) {
        setInternalSingle(next);
      }
      singleRest.onValueChange?.(next);
    },
    [internalMulti, internalSingle, isMultiple, multiRest, singleRest],
  );

  const getTriggerId = useCallback(
    (itemValue: string): string => {
      const safe = itemValue.replace(/[^a-zA-Z0-9_-]/g, '_');
      return `${baseId}-trigger-${safe}`;
    },
    [baseId],
  );

  const getPanelId = useCallback(
    (itemValue: string): string => {
      const safe = itemValue.replace(/[^a-zA-Z0-9_-]/g, '_');
      return `${baseId}-panel-${safe}`;
    },
    [baseId],
  );

  const contextValue = useMemo(
    (): AccordionRootContextValue => ({
      getPanelId,
      getTriggerId,
      isOpen,
      rootRef,
      toggle,
      type,
      variant,
    }),
    [getPanelId, getTriggerId, isOpen, toggle, type, variant],
  );

  const {
    defaultValue,
    onValueChange,
    value,
    ...divProps
  } = rest as AccordionMultipleProps;
  void defaultValue;
  void onValueChange;
  void value;

  return { contextValue, divProps };
};
