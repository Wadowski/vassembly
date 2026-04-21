import { Fragment, type ReactNode, type MouseEvent } from 'react';
import { NavCollapsibleGroup } from '../nav-group/NavCollapsibleGroup';
import { NavLinkRow } from '../nav-items/NavLinkRow';
import type { DrawerNavigateEvent, NavGroupItem, NavLinkItem } from '../types';
import styles from './NavList.module.scss';

export interface NavListItemsProps {
  items: ReadonlyArray<NavLinkItem | NavGroupItem>;
  activeLinkId: string | null;
  isNested: boolean;
  isRootList: boolean;
  isGroupExpanded: (groupId: string) => boolean;
  onToggleGroup: (args: { groupId: string }) => void;
  isReducedMotion: boolean;
  onNavigate: (event: DrawerNavigateEvent) => void;
  LinkComponent?: React.ComponentType<{ href: string; onClick: (event: MouseEvent<HTMLAnchorElement>) => void; className: string; children: ReactNode; target?: string; rel?: string; 'aria-current'?: 'page' | 'step' | 'location' | 'date' | 'time' | boolean }>;
}

interface RenderLinkItemArgs {
  item: NavLinkItem;
  activeLinkId: string | null;
  isNested: boolean;
  onNavigate: (event: DrawerNavigateEvent) => void;
  LinkComponent?: React.ComponentType<{ href: string; onClick: (event: MouseEvent<HTMLAnchorElement>) => void; className: string; children: ReactNode; target?: string; rel?: string; 'aria-current'?: 'page' | 'step' | 'location' | 'date' | 'time' | boolean }>;
}

const renderLinkItem = (args: RenderLinkItemArgs): JSX.Element => {
  const { item, activeLinkId, isNested, onNavigate, LinkComponent } = args;
  const isActive = activeLinkId === item.id;

  return (
    <NavLinkRow
      item={item}
      isActive={isActive}
      isNested={isNested}
      onNavigate={onNavigate}
      LinkComponent={LinkComponent}
    />
  );
};

export const NavListItems = (props: NavListItemsProps): JSX.Element => {
  const {
    items,
    activeLinkId,
    isNested,
    isRootList,
    isGroupExpanded,
    onToggleGroup,
    isReducedMotion,
    onNavigate,
    LinkComponent,
  } = props;

  const nodes = items.map((item) => {
    if (item.kind === 'link') {
      return (
        <li key={item.id} className={styles.item}>
          {renderLinkItem({ item, activeLinkId, isNested, onNavigate, LinkComponent })}
        </li>
      );
    }
    const panelId = `${item.id}-panel`;
    return (
      <NavCollapsibleGroup
        key={item.id}
        item={item}
        isExpanded={isGroupExpanded(item.id)}
        onToggle={onToggleGroup}
        panelId={panelId}
        isReducedMotion={isReducedMotion}
      >
        <NavListItems
          items={item.children}
          activeLinkId={activeLinkId}
          isNested
          isRootList={false}
          isGroupExpanded={isGroupExpanded}
          onToggleGroup={onToggleGroup}
          isReducedMotion={isReducedMotion}
          onNavigate={onNavigate}
          LinkComponent={LinkComponent}
        />
      </NavCollapsibleGroup>
    );
  });

  if (isRootList) {
    return <ul className={styles.list}>{nodes}</ul>;
  }

  return <Fragment>{nodes}</Fragment>;
};

NavListItems.displayName = 'NavListItems';
