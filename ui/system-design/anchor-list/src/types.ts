export interface AnchorListItem {
  label: string;
  href: string;
}

export type AnchorListSize = 'small' | 'medium' | 'large';

export interface AnchorListProps {
  items: AnchorListItem[];
  activeHref?: string;
  size?: AnchorListSize;
  isDisabled?: boolean;
  onItemClick?: (item: AnchorListItem) => void;
  ariaLabel?: string;
}
