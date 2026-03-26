import type { MouseEvent } from 'react';
import { Checkbox } from '@vassembly/ui-checkbox';
import { resolveClassName } from '@vassembly/ui-utils';
import styles from './MultiSelect.module.scss';
import { MultiSelectOptionsListItem } from './MultiSelectOptionsListItem';
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
          className={resolveClassName(
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
        return (
          <MultiSelectOptionsListItem
            key={option.value}
            option={option}
            optionIndex={index}
            flatIndex={flatIndex}
            highlightedIndex={highlightedIndex}
            isSelected={isSelected}
            getOptionDomId={getOptionDomId}
            onHighlightIndexChange={onHighlightIndexChange}
            onToggleValue={onToggleValue}
          />
        );
      })}
    </ul>
  );
};

MultiSelectOptionsList.displayName = 'MultiSelectOptionsList';
