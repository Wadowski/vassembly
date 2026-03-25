import type { MouseEvent } from 'react';
import { Checkbox } from '@vassembly/ui-checkbox';
import { className as uiClassName } from '@vassembly/ui-utils';
import styles from './MultiSelect.module.scss';
import type { MultiSelectOptionsListProps } from './types';

export const MultiSelectOptionsList = ({
  listboxId,
  label,
  options,
  highlightedIndex,
  selectedValues,
  hasSelectAll,
  selectAllDomId,
  allSelected,
  someSelected,
  isSelectAllDisabled,
  getOptionDomId,
  onHighlightIndexChange,
  onToggleValue,
  onToggleAll,
}: MultiSelectOptionsListProps) => {
  const handleSelectAllClick = (): void => {
    if (!isSelectAllDisabled) {
      onToggleAll();
    }
  };

  const handleOptionClick = ({
    value,
    isDisabled,
  }: {
    value: string;
    isDisabled: boolean;
  }): void => {
    if (!isDisabled) {
      onToggleValue(value);
    }
  };

  return (
    <ul
      id={listboxId}
      role="listbox"
      aria-multiselectable="true"
      className={styles.list}
      aria-label={label}
    >
      {hasSelectAll ? (
        <li
          id={selectAllDomId}
          role="option"
          aria-selected={allSelected}
          className={uiClassName(
            styles.option,
            styles.selectAllDivider,
            highlightedIndex === 0 && styles.isHighlighted,
          )}
          onMouseEnter={() => {
            onHighlightIndexChange(0);
          }}
          onMouseDown={(event: MouseEvent) => {
            event.preventDefault();
          }}
          onClick={handleSelectAllClick}
        >
          <div className={styles.optionContent}>
            <Checkbox
              checked={allSelected ? true : someSelected ? 'indeterminate' : false}
              label="Select all"
              size="small"
              isDisabled={isSelectAllDisabled}
              isReadOnly
            />
          </div>
        </li>
      ) : null}
      {options.map((option, index) => {
        const flatIndex = hasSelectAll ? index + 1 : index;
        const isSelected = selectedValues.includes(option.value);
        const isDisabled = Boolean(option.isDisabled);
        const optionClassName = uiClassName(
          styles.option,
          flatIndex === highlightedIndex && styles.isHighlighted,
          isSelected && styles.isSelected,
          isDisabled && styles.isDisabled,
        );
        return (
          <li
            key={option.value}
            id={getOptionDomId(index)}
            role="option"
            aria-selected={isSelected}
            className={optionClassName}
            onMouseEnter={() => {
              onHighlightIndexChange(flatIndex);
            }}
            onMouseDown={(event: MouseEvent) => {
              event.preventDefault();
            }}
            onClick={() => {
              handleOptionClick({ value: option.value, isDisabled });
            }}
          >
            <div className={styles.optionContent}>
              <Checkbox
                checked={isSelected}
                label={option.label}
                size="small"
                isDisabled={isDisabled}
                isReadOnly
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
};

MultiSelectOptionsList.displayName = 'MultiSelectOptionsList';
