import type { MenuSelectionMode } from './types';

type GetNextSelectedKeysProps = {
  mode: MenuSelectionMode;
  selectedKeys: string[];
  itemKey: string;
};
export const getNextSelectedKeys = ({
  mode,
  selectedKeys,
  itemKey,
}: GetNextSelectedKeysProps): string[] => {
  if (mode === 'single') {
    return [itemKey];
  }
  if (selectedKeys.includes(itemKey)) {
    return selectedKeys.filter((key) => key !== itemKey);
  }
  return [...selectedKeys, itemKey];
};
