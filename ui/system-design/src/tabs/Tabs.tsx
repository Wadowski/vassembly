import { forwardRef } from 'react';
import { Text } from '@vassembly/ui-system-design/text';
import { resolveClassName } from '@vassembly/ui-system-design/utils';
import styles from './Tabs.module.scss';
import type { TabsProps } from './types';
import { useTabs } from './useTabs';

export const Tabs = forwardRef<HTMLDivElement, TabsProps>((props, ref) => {
  const { items, activeTab, onChange, className } = props;

  const { resolvedActiveTab, assignTabRef, selectTab, handleKeyDown } = useTabs({
    items,
    activeTab,
    onChange,
  });

  return (
    <div ref={ref} className={resolveClassName(styles.wrapper, className)} role="tablist" aria-orientation="horizontal">
      {items.map((item, index) => {
        const isSelected = item.value === resolvedActiveTab;
        const isDisabled = Boolean(item.isDisabled);
        return (
          <button
            key={item.value}
            ref={(element) => assignTabRef({ index, element })}
            type="button"
            role="tab"
            aria-selected={isSelected ? 'true' : 'false'}
            aria-disabled={isDisabled ? 'true' : undefined}
            disabled={isDisabled}
            tabIndex={isSelected ? 0 : -1}
            className={resolveClassName(styles.tabButton, isSelected && styles.isActive, isDisabled && styles.isDisabled)}
            onClick={() => selectTab({ value: item.value, index })}
            onKeyDown={(event) => handleKeyDown({ event, index, value: item.value })}
          >
            <Text variant="label" as="span">
              {item.label}
            </Text>
          </button>
        );
      })}
    </div>
  );
});

Tabs.displayName = 'Tabs';
