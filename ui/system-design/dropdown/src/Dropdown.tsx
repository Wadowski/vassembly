import type React from 'react';
import { Button } from '@vassembly/ui-button';
import { Text } from '@vassembly/ui-text';
import { className as uiClassName } from '@vassembly/ui-utils';
import { ChevronIcon } from './ChevronIcon';
import { DropdownOptionsList } from './DropdownOptionsList';
import { useDropdown } from './useDropdown';
import styles from './Dropdown.module.scss';
import type { DropdownProps } from './types';

export const Dropdown = ({
  options,
  value,
  defaultValue = '',
  onValueChange,
  placeholder,
  label,
  isDisabled = false,
  isFullWidth = false,
  size = 'medium',
  className,
  id,
  name,
}: DropdownProps) => {
  const {
    rootRef,
    triggerId,
    listboxId,
    isOpen,
    highlightedIndex,
    selectedValue,
    triggerLabel,
    showPlaceholder,
    activeDescendantId,
    hasHiddenInput,
    hiddenInputName,
    toggleMenu,
    commitSelection,
    setHighlightedIndex,
    getOptionDomId,
    handleTriggerKeyDown,
  } = useDropdown({
    options,
    value,
    defaultValue,
    onValueChange,
    placeholder,
    isDisabled,
    id,
    name,
  });

  const wrapperClassName = uiClassName(styles.wrapper, isFullWidth && styles.isFullWidth, className);

  return (
    <div ref={rootRef} className={wrapperClassName}>
      {hasHiddenInput && hiddenInputName ? (
        <input type="hidden" name={hiddenInputName} value={selectedValue} readOnly tabIndex={-1} />
      ) : null}
      {label ? (
        <label htmlFor={triggerId} className={styles.label}>
          <Text variant="label" as="span">
            {label}
          </Text>
        </label>
      ) : null}
      <div className={styles.triggerWrap}>
        <Button
          id={triggerId}
          type="button"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={activeDescendantId}
          aria-haspopup="listbox"
          text={
            showPlaceholder ? (
              <span className={styles.placeholderText}>{placeholder}</span>
            ) : (
              triggerLabel
            )
          }
          variant="outlined"
          color="secondary"
          size={size}
          isDisabled={isDisabled}
          isFullWidth={isFullWidth}
          icon={(iconProps: React.SVGProps<SVGSVGElement> & { className?: string }) => (
            <ChevronIcon isOpen={isOpen} {...iconProps} />
          )}
          iconPosition="right"
          onClick={toggleMenu}
          onKeyDown={handleTriggerKeyDown}
        />
        {isOpen && options.length > 0 ? (
          <DropdownOptionsList
            listboxId={listboxId}
            label={label}
            options={options}
            highlightedIndex={highlightedIndex}
            selectedValue={selectedValue}
            getOptionDomId={getOptionDomId}
            onHighlightIndexChange={setHighlightedIndex}
            onSelectValue={commitSelection}
          />
        ) : null}
      </div>
    </div>
  );
};

Dropdown.displayName = 'Dropdown';
