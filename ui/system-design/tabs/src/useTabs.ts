import { useMemo, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import type { TabsItem, TabsProps } from './types';

type TabDirection = 'next' | 'prev';

const getEnabledIndex = (args: {
  items: TabsItem[];
  startIndex: number;
  direction: TabDirection;
}): number | null => {
  const { items, startIndex, direction } = args;
  if (items.length === 0) return null;

  const step = direction === 'next' ? 1 : -1;
  let currentIndex = startIndex;

  for (let i = 0; i < items.length; i += 1) {
    currentIndex = (currentIndex + step + items.length) % items.length;
    if (!items[currentIndex]?.isDisabled) {
      return currentIndex;
    }
  }

  return null;
};

type UseTabsArgs = Pick<TabsProps, 'items' | 'activeTab' | 'onChange'>;

export type UseTabsResult = {
  items: TabsItem[];
  resolvedActiveTab: string;
  assignTabRef: (args: { index: number; element: HTMLButtonElement | null }) => void;
  selectTab: (args: { value: string; index: number }) => void;
  handleKeyDown: (args: {
    event: KeyboardEvent<HTMLButtonElement>;
    index: number;
    value: string;
  }) => void;
};

export const useTabs = (args: UseTabsArgs): UseTabsResult => {
  const { items, activeTab, onChange } = args;

  const resolvedActiveTab = useMemo(() => {
    const hasActive = items.some((item) => item.value === activeTab);
    if (hasActive) return activeTab;

    const firstEnabled = items.find((item) => !item.isDisabled)?.value;
    return firstEnabled ?? activeTab;
  }, [activeTab, items]);

  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const selectTab = (selectArgs: { value: string; index: number }): void => {
    const { value, index } = selectArgs;
    const selectedItem = items[index];
    if (!selectedItem || selectedItem.isDisabled) return;
    if (value === resolvedActiveTab) return;
    onChange?.(value);
  };

  const focusTab = (index: number): void => {
    const el = tabRefs.current[index];
    el?.focus();
  };

  const handleKeyDown = (keyArgs: {
    event: KeyboardEvent<HTMLButtonElement>;
    index: number;
    value: string;
  }): void => {
    const { event, index, value } = keyArgs;

    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();

      const nextIndex = getEnabledIndex({
        items,
        startIndex: index,
        direction: event.key === 'ArrowRight' ? 'next' : 'prev',
      });
      if (nextIndex == null) return;

      focusTab(nextIndex);
      selectTab({ value: items[nextIndex]?.value ?? '', index: nextIndex });
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      const firstIndex = items.findIndex((item) => !item.isDisabled);
      if (firstIndex === -1) return;
      focusTab(firstIndex);
      selectTab({ value: items[firstIndex]?.value ?? '', index: firstIndex });
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      for (let i = items.length - 1; i >= 0; i -= 1) {
        if (!items[i]?.isDisabled) {
          focusTab(i);
          selectTab({ value: items[i]?.value ?? '', index: i });
          return;
        }
      }
    }

    if (event.key === 'Enter' || event.key === ' ') {
      if (value === resolvedActiveTab) return;
      event.preventDefault();
      selectTab({ value, index });
    }
  };

  const assignTabRef = (refArgs: { index: number; element: HTMLButtonElement | null }): void => {
    const { index, element } = refArgs;
    tabRefs.current[index] = element;
  };

  return {
    items,
    resolvedActiveTab,
    assignTabRef,
    selectTab,
    handleKeyDown,
  };
};
