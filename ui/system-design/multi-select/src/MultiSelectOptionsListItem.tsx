import type { MouseEvent } from 'react';
import { Checkbox } from '@vassembly/ui-checkbox';
import { resolveClassName } from '@vassembly/ui-utils';
import styles from './MultiSelect.module.scss';
import type { MultiSelectOptionsListItemProps } from './types';

export const MultiSelectOptionsListItem = ({
  option,
  optionIndex,
  flatIndex,
  highlightedIndex,
  isSelected,
  getOptionDomId,
  onHighlightIndexChange,
  onToggleValue,
}: MultiSelectOptionsListItemProps): JSX.Element => {
  const isDisabled = Boolean(option.isDisabled);
  const optionClassName = resolveClassName(
    styles.option,
    flatIndex === highlightedIndex && styles.isHighlighted,
    isSelected && styles.isSelected,
    isDisabled && styles.isDisabled,
  );

  const handleClick = (): void => {
    if (!isDisabled) {
      onToggleValue(option.value);
    }
  };

  return (
    <li
      id={getOptionDomId(optionIndex)}
      role="option"
      aria-selected={isSelected}
      className={optionClassName}
      onMouseEnter={() => {
        onHighlightIndexChange(flatIndex);
      }}
      onMouseDown={(event: MouseEvent) => {
        event.preventDefault();
      }}
      onClick={handleClick}
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
};

MultiSelectOptionsListItem.displayName = 'MultiSelectOptionsListItem';
