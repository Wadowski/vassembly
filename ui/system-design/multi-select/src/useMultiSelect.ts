import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { UseMultiSelectArgs, UseMultiSelectReturn } from './types';

export const useMultiSelect = ({
  options,
  values,
  defaultValues,
  onValuesChange,
  isDisabled,
  id,
  hasSelectAll,
  placeholder,
  maxDisplayLabels,
}: UseMultiSelectArgs): UseMultiSelectReturn => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const baseId = useId();
  const listboxId = `${baseId}-listbox`;
  const triggerId = id ?? `${baseId}-trigger`;
  const selectAllDomId = `${baseId}-select-all`;

  const isControlled = values !== undefined;
  const [internalValues, setInternalValues] = useState<string[]>(defaultValues);
  const selectedValues = isControlled ? (values as string[]) : internalValues;

  const enabledValues = useMemo(
    () => options.filter((option) => !option.isDisabled).map((option) => option.value),
    [options],
  );

  const allSelected =
    enabledValues.length > 0 && enabledValues.every((v) => selectedValues.includes(v));
  const someSelected =
    enabledValues.some((v) => selectedValues.includes(v)) && !allSelected;

  const [isOpen, setIsOpen] = useState<boolean>(false);

  const maxFlatIndex = useMemo(() => {
    if (options.length === 0) {
      return 0;
    }
    return hasSelectAll ? options.length : options.length - 1;
  }, [hasSelectAll, options.length]);

  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);

  useEffect(() => {
    if (options.length === 0) {
      return;
    }
    if (!isOpen) {
      return;
    }
    const handlePointerDown = (event: MouseEvent): void => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isOpen, options.length]);

  useEffect(() => {
    if (highlightedIndex > maxFlatIndex) {
      setHighlightedIndex(maxFlatIndex);
    }
  }, [highlightedIndex, maxFlatIndex]);

  const openMenu = useCallback((): void => {
    if (isDisabled || options.length === 0) {
      return;
    }
    let nextFlat = 0;
    if (hasSelectAll) {
      nextFlat = 0;
    } else {
      const firstSelectedIndex = options.findIndex((option) => selectedValues.includes(option.value));
      nextFlat = firstSelectedIndex >= 0 ? firstSelectedIndex : 0;
    }
    setHighlightedIndex(nextFlat);
    setIsOpen(true);
  }, [hasSelectAll, isDisabled, options, selectedValues]);

  const closeMenu = useCallback((): void => {
    setIsOpen(false);
  }, []);

  const toggleMenu = useCallback((): void => {
    if (isOpen) {
      closeMenu();
      return;
    }
    openMenu();
  }, [closeMenu, isOpen, openMenu]);

  const toggleValue = useCallback(
    (value: string): void => {
      const option = options.find((opt) => opt.value === value);
      if (option?.isDisabled) {
        return;
      }
      if (isControlled) {
        const prev = values ?? [];
        const next = prev.includes(value)
          ? prev.filter((v) => v !== value)
          : [...prev, value];
        onValuesChange?.(next);
        return;
      }
      setInternalValues((prev) => {
        const next = prev.includes(value)
          ? prev.filter((v) => v !== value)
          : [...prev, value];
        onValuesChange?.(next);
        return next;
      });
    },
    [isControlled, onValuesChange, options, values],
  );

  const toggleAll = useCallback((): void => {
    if (enabledValues.length === 0) {
      return;
    }
    if (isControlled) {
      const prev = values ?? [];
      const isEveryEnabledSelected = enabledValues.every((v) => prev.includes(v));
      const next = isEveryEnabledSelected
        ? prev.filter((v) => !enabledValues.includes(v))
        : [...new Set([...prev, ...enabledValues])];
      onValuesChange?.(next);
      return;
    }
    setInternalValues((prev) => {
      const isEveryEnabledSelected = enabledValues.every((v) => prev.includes(v));
      const next = isEveryEnabledSelected
        ? prev.filter((v) => !enabledValues.includes(v))
        : [...new Set([...prev, ...enabledValues])];
      onValuesChange?.(next);
      return next;
    });
  }, [enabledValues, isControlled, onValuesChange, values]);

  const getOptionDomId = useCallback(
    (index: number): string => `${baseId}-option-${index}`,
    [baseId],
  );

  const orderedSelectedLabels = useMemo(() => {
    return options
      .filter((option) => selectedValues.includes(option.value))
      .map((option) => option.label);
  }, [options, selectedValues]);

  const triggerLabel = useMemo(() => {
    const count = orderedSelectedLabels.length;
    if (count === 0) {
      return '\u00a0';
    }
    if (count > maxDisplayLabels) {
      return `${count} selected`;
    }
    return orderedSelectedLabels.join(', ');
  }, [orderedSelectedLabels, maxDisplayLabels]);

  const showPlaceholder = selectedValues.length === 0 && Boolean(placeholder);

  const activeDescendantId = useMemo(() => {
    if (!isOpen || options.length === 0) {
      return undefined;
    }
    if (hasSelectAll && highlightedIndex === 0) {
      return selectAllDomId;
    }
    const optionIndex = hasSelectAll ? highlightedIndex - 1 : highlightedIndex;
    if (optionIndex < 0 || optionIndex >= options.length) {
      return undefined;
    }
    return getOptionDomId(optionIndex);
  }, [getOptionDomId, hasSelectAll, highlightedIndex, isOpen, options.length, selectAllDomId]);

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
    if (isDisabled || options.length === 0) {
      return;
    }
    if (event.key === 'Tab' && isOpen) {
      setIsOpen(false);
      return;
    }
    if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      setIsOpen(false);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!isOpen) {
        openMenu();
        return;
      }
      setHighlightedIndex((current) => Math.min(current + 1, maxFlatIndex));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!isOpen) {
        openMenu();
        setHighlightedIndex(maxFlatIndex);
        return;
      }
      setHighlightedIndex((current) => Math.max(current - 1, 0));
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (isOpen) {
        if (hasSelectAll && highlightedIndex === 0) {
          if (enabledValues.length > 0) {
            toggleAll();
          }
          return;
        }
        const optionIndex = hasSelectAll ? highlightedIndex - 1 : highlightedIndex;
        const option = options[optionIndex];
        if (option && !option.isDisabled) {
          toggleValue(option.value);
        }
      } else {
        openMenu();
      }
      return;
    }
    if (event.key === 'Home' && isOpen) {
      event.preventDefault();
      setHighlightedIndex(0);
      return;
    }
    if (event.key === 'End' && isOpen) {
      event.preventDefault();
      setHighlightedIndex(maxFlatIndex);
    }
  };

  return {
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
    openMenu,
    closeMenu,
    toggleMenu,
    toggleValue,
    toggleAll,
    setHighlightedIndex,
    getOptionDomId,
    handleTriggerKeyDown,
  };
};
