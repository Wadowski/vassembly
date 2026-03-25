import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type React from 'react';
import type { UseDropdownArgs, UseDropdownReturn } from './types';

export const useDropdown = ({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder,
  isDisabled,
  id,
  name,
}: UseDropdownArgs): UseDropdownReturn => {
  const rootRef = useRef<HTMLDivElement>(null!);
  const baseId = useId();
  const listboxId = `${baseId}-listbox`;
  const triggerId = id ?? `${baseId}-trigger`;

  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<string>(defaultValue);
  const selectedValue = isControlled ? (value as string) : internalValue;

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const selectedIndex = useMemo<number>(
    () => options.findIndex((option) => option.value === selectedValue),
    [options, selectedValue],
  );
  const [highlightedIndex, setHighlightedIndex] = useState<number>(() =>
    selectedIndex >= 0 ? selectedIndex : 0,
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (highlightedIndex >= options.length && options.length > 0) {
      setHighlightedIndex(options.length - 1);
    }
  }, [highlightedIndex, options.length]);

  const selectedOption = options.find((option) => option.value === selectedValue);
  const showPlaceholder = !selectedOption && !!placeholder;

  const openMenu = useCallback((): void => {
    if (isDisabled || options.length === 0) {
      return;
    }
    const nextHighlight = selectedIndex >= 0 ? selectedIndex : 0;
    setHighlightedIndex(nextHighlight);
    setIsOpen(true);
  }, [isDisabled, options.length, selectedIndex]);

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

  const commitSelection = useCallback(
    (nextValue: string): void => {
      if (!isControlled) {
        setInternalValue(nextValue);
      }
      onValueChange?.(nextValue);
      setIsOpen(false);
    },
    [isControlled, onValueChange],
  );

  const getOptionDomId = useCallback(
    (index: number): string => `${baseId}-option-${index}`,
    [baseId],
  );

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>): void => {
    if (isDisabled || options.length === 0) {
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
      setHighlightedIndex((current) => Math.min(current + 1, options.length - 1));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!isOpen) {
        openMenu();
        setHighlightedIndex(options.length - 1);
        return;
      }
      setHighlightedIndex((current) => Math.max(current - 1, 0));
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (isOpen) {
        const option = options[highlightedIndex];
        if (option) {
          commitSelection(option.value);
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
      setHighlightedIndex(options.length - 1);
    }
  };

  const triggerLabel = selectedOption?.label ?? placeholder ?? '\u00a0';

  const activeDescendantId =
    isOpen && options.length > 0 ? getOptionDomId(highlightedIndex) : undefined;

  const hasHiddenInput = name != null && name !== '';

  return {
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
    hiddenInputName: hasHiddenInput ? name : undefined,
    openMenu,
    closeMenu,
    toggleMenu,
    commitSelection,
    setHighlightedIndex,
    getOptionDomId,
    handleTriggerKeyDown,
  };
};
