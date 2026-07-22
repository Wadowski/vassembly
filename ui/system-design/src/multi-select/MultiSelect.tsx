import { forwardRef, useLayoutEffect } from 'react';
import { ArrowDownIcon } from '@vassembly/ui-system-design/icons';
import { Button } from '@vassembly/ui-system-design/button';
import { Text } from '@vassembly/ui-system-design/text';
import { resolveClassName } from '@vassembly/ui-system-design/utils';
import { MultiSelectOptionsList } from './MultiSelectOptionsList';
import styles from './MultiSelect.module.scss';
import type { MultiSelectProps } from './types';
import { useMultiSelect } from './useMultiSelect';

export const MultiSelect = forwardRef<HTMLDivElement, MultiSelectProps>(
  (
    {
      options,
      values,
      defaultValues = [],
      onValuesChange,
      placeholder,
      label,
      isDisabled = false,
      isFullWidth = false,
      size = 'medium',
      className,
      id,
      name,
      hasSelectAll = false,
      maxDisplayLabels = 2,
    },
    ref,
  ) => {
    const {
      rootRef,
      triggerId,
      listboxId,
      selectAllDomId,
      isOpen,
      highlightedIndex,
      selectedValues,
      triggerLabel,
      showPlaceholder,
      activeDescendantId,
      allSelected,
      someSelected,
      toggleMenu,
      toggleValue,
      toggleAll,
      setHighlightedIndex,
      getOptionDomId,
      handleTriggerKeyDown,
    } = useMultiSelect({
      options,
      values,
      defaultValues,
      onValuesChange,
      isDisabled,
      id,
      hasSelectAll,
      placeholder,
      maxDisplayLabels,
    });

    const wrapperClassName = resolveClassName(styles.wrapper, isFullWidth && styles.isFullWidth, className);

    const hasHiddenInput = name != null && name !== '';

    const enabledValues = options
      .filter((option) => !option.isDisabled)
      .map((option) => option.value);
    const isSelectAllDisabled = enabledValues.length === 0;

    useLayoutEffect(() => {
      const node = rootRef.current;
      if (typeof ref === 'function') {
        ref(node);
        return () => {
          ref(null);
        };
      }
      if (ref) {
        ref.current = node;
      }
      return () => {
        if (ref && typeof ref !== 'function') {
          ref.current = null;
        }
      };
    }, [ref, rootRef]);

    return (
      <div ref={rootRef} className={wrapperClassName}>
        {hasHiddenInput
          ? selectedValues.map((value) => (
              <input key={value} type="hidden" name={name} value={value} readOnly tabIndex={-1} />
            ))
          : null}
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
            aria-multiselectable="true"
            aria-expanded={isOpen}
            aria-controls={listboxId}
            aria-activedescendant={activeDescendantId}
            aria-haspopup="listbox"
            textVariant="body1"
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
            icon={() => (
              <span aria-hidden="true">
                <ArrowDownIcon
                  className={resolveClassName(styles.chevron, isOpen && styles.chevronOpen)}
                />
              </span>
            )}
            iconPosition="right"
            onClick={toggleMenu}
            onKeyDown={handleTriggerKeyDown}
          />
          {isOpen && options.length > 0 ? (
            <MultiSelectOptionsList
              listboxId={listboxId}
              label={label}
              options={options}
              highlightedIndex={highlightedIndex}
              selectedValues={selectedValues}
              hasSelectAll={hasSelectAll}
              selectAllDomId={selectAllDomId}
              allSelected={allSelected}
              someSelected={someSelected}
              isSelectAllDisabled={isSelectAllDisabled}
              getOptionDomId={getOptionDomId}
              onHighlightIndexChange={setHighlightedIndex}
              onToggleValue={toggleValue}
              onToggleAll={toggleAll}
            />
          ) : null}
        </div>
      </div>
    );
  },
);

MultiSelect.displayName = 'MultiSelect';
