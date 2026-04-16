import { Fragment, type ReactNode } from 'react';
import { NavCollapsibleGroup } from './NavCollapsibleGroup';
import { NavLinkRow } from './NavLinkRow';
import type { DrawerNavigateEvent, NavGroupItem, NavLinkItem, RenderNavLinkArgs } from './types';
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
  renderLink?: (args: RenderNavLinkArgs) => ReactNode;
}

interface RenderLinkItemArgs {
  item: NavLinkItem;
  activeLinkId: string | null;
  isNested: boolean;
  onNavigate: (event: DrawerNavigateEvent) => void;
  renderLink?: (args: RenderNavLinkArgs) => ReactNode;
}

const renderLinkItem = (args: RenderLinkItemArgs): JSX.Element => {
  const { item, activeLinkId, isNested, onNavigate, renderLink } = args;
  const isActive = activeLinkId === item.id;

  return (
    <NavLinkRow
      item={item}
      isActive={isActive}
      isNested={isNested}
      onNavigate={onNavigate}
      renderLink={renderLink}
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
    renderLink,
  } = props;

  const nodes = items.map((item) => {
    if (item.kind === 'link') {
      return (
        <li key={item.id} className={styles.item}>
          {renderLinkItem({ item, activeLinkId, isNested, onNavigate, renderLink })}
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
          renderLink={renderLink}
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
