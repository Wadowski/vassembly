import type React from 'react';
import { Text } from '@vassembly/ui-text';
import { className as uiClassName } from '@vassembly/ui-utils';
import styles from './Dropdown.module.scss';
import type { DropdownOptionsListProps } from './types';

export const DropdownOptionsList = ({
  listboxId,
  label,
  options,
  highlightedIndex,
  selectedValue,
  getOptionDomId,
  onHighlightIndexChange,
  onSelectValue,
}: DropdownOptionsListProps) => {
  return (
    <ul id={listboxId} role="listbox" className={styles.list} aria-label={label}>
      {options.map((option, index) => {
        const optionClassName = uiClassName(
          styles.option,
          index === highlightedIndex && styles.isHighlighted,
          option.value === selectedValue && styles.isSelected,
        );
        return (
          <li
            key={option.value}
            id={getOptionDomId(index)}
            role="option"
            aria-selected={option.value === selectedValue}
            className={optionClassName}
            onMouseEnter={() => {
              onHighlightIndexChange(index);
            }}
            onMouseDown={(event: React.MouseEvent) => {
              event.preventDefault();
            }}
            onClick={() => {
              onSelectValue(option.value);
            }}
          >
            <Text variant="body1" as="span">
              {option.label}
            </Text>
          </li>
        );
      })}
    </ul>
  );
};

DropdownOptionsList.displayName = 'DropdownOptionsList';
