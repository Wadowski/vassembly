export type DropdownOption = {
  value: string;
  label: string;
};

export type DropdownSize = 'small' | 'medium' | 'large';

export type DropdownProps = {
  options: DropdownOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  isDisabled?: boolean;
  isFullWidth?: boolean;
  size?: DropdownSize;
  className?: string;
  id?: string;
  name?: string;
};

export type DropdownOptionsListProps = {
  listboxId: string;
  label?: string;
  options: DropdownOption[];
  highlightedIndex: number;
  selectedValue: string;
  getOptionDomId: (index: number) => string;
  onHighlightIndexChange: (index: number) => void;
  onSelectValue: (value: string) => void;
};

export type UseDropdownArgs = {
  options: DropdownProps['options'];
  value: DropdownProps['value'];
  defaultValue: string;
  onValueChange: DropdownProps['onValueChange'];
  placeholder: DropdownProps['placeholder'];
  isDisabled: boolean;
  id: DropdownProps['id'];
  name: DropdownProps['name'];
};

export type UseDropdownReturn = {
  rootRef: React.RefObject<HTMLDivElement>;
  triggerId: string;
  listboxId: string;

  isOpen: boolean;
  highlightedIndex: number;
  selectedValue: string;

  triggerLabel: string;
  showPlaceholder: boolean;
  activeDescendantId: string | undefined;

  hasHiddenInput: boolean;
  hiddenInputName: string | undefined;

  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
  commitSelection: (nextValue: string) => void;
  setHighlightedIndex: React.Dispatch<React.SetStateAction<number>>;
  getOptionDomId: (index: number) => string;
  handleTriggerKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
};
