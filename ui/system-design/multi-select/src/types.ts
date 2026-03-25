import type { Dispatch, KeyboardEvent, MutableRefObject, SetStateAction, SVGProps } from 'react';

export type MultiSelectOption = {
  value: string;
  label: string;
  isDisabled?: boolean;
};

export type MultiSelectSize = 'small' | 'medium' | 'large';

export type MultiSelectProps = {
  options: MultiSelectOption[];
  values?: string[];
  defaultValues?: string[];
  onValuesChange?: (values: string[]) => void;
  placeholder?: string;
  label?: string;
  isDisabled?: boolean;
  isFullWidth?: boolean;
  size?: MultiSelectSize;
  className?: string;
  id?: string;
  name?: string;
  hasSelectAll?: boolean;
  maxDisplayLabels?: number;
};

export type ChevronIconProps = SVGProps<SVGSVGElement> & {
  className?: string;
  isOpen: boolean;
};

export type MultiSelectOptionsListProps = {
  listboxId: string;
  label?: string;
  options: MultiSelectOption[];
  highlightedIndex: number;
  selectedValues: string[];
  hasSelectAll: boolean;
  selectAllDomId: string;
  allSelected: boolean;
  someSelected: boolean;
  isSelectAllDisabled: boolean;
  getOptionDomId: (index: number) => string;
  onHighlightIndexChange: (index: number) => void;
  onToggleValue: (value: string) => void;
  onToggleAll: () => void;
};

export type UseMultiSelectArgs = {
  options: MultiSelectOption[];
  values?: string[];
  defaultValues: string[];
  onValuesChange?: (values: string[]) => void;
  isDisabled: boolean;
  id?: string;
  hasSelectAll: boolean;
  placeholder?: string;
  maxDisplayLabels: number;
};

export type UseMultiSelectReturn = {
  rootRef: MutableRefObject<HTMLDivElement | null>;
  triggerId: string;
  listboxId: string;
  selectAllDomId: string;
  isOpen: boolean;
  highlightedIndex: number;
  selectedValues: string[];
  triggerLabel: string;
  showPlaceholder: boolean;
  activeDescendantId: string | undefined;
  allSelected: boolean;
  someSelected: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
  toggleValue: (value: string) => void;
  toggleAll: () => void;
  setHighlightedIndex: Dispatch<SetStateAction<number>>;
  getOptionDomId: (index: number) => string;
  handleTriggerKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
};
