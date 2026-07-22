export type TabsItem = {
  label: string;
  value: string;
  isDisabled?: boolean;
};

export type TabsProps = {
  items: TabsItem[];
  activeTab: string;
  onChange?: (nextValue: string) => void;
  className?: string;
};

