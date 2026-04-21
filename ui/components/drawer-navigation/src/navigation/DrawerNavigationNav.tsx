import { Fragment, type ReactNode, type MouseEvent } from 'react';
import { NavSectionLabel } from '../nav-items/NavSectionLabel';
import { NavListItems } from './NavListItems';
import type { DrawerNavigateEvent, NavSection, RenderNavLinkArgs } from '../types';

export interface DrawerNavigationNavProps {
  sections: ReadonlyArray<NavSection>;
  activeLinkId: string | null;
  mainNavAriaLabel: string;
  isGroupExpanded: (groupId: string) => boolean;
  onToggleGroup: (args: { groupId: string }) => void;
  isReducedMotion: boolean;
  onNavigate: (event: DrawerNavigateEvent) => void;
  LinkComponent?: React.ComponentType<{ href: string; onClick: (event: MouseEvent<HTMLAnchorElement>) => void; className: string; children: ReactNode; target?: string; rel?: string; 'aria-current'?: 'page' | 'step' | 'location' | 'date' | 'time' | boolean }>;
}

export const DrawerNavigationNav = (props: DrawerNavigationNavProps): JSX.Element => {
  const {
    sections,
    activeLinkId,
    mainNavAriaLabel,
    isGroupExpanded,
    onToggleGroup,
    isReducedMotion,
    onNavigate,
    LinkComponent,
  } = props;

  return (
    <nav aria-label={mainNavAriaLabel}>
      {sections.map((section) => (
        <Fragment key={section.id}>
          <NavSectionLabel id={`${section.id}-label`}>{section.label}</NavSectionLabel>
          <NavListItems
            items={section.items}
            activeLinkId={activeLinkId}
            isNested={false}
            isRootList
            isGroupExpanded={isGroupExpanded}
            onToggleGroup={onToggleGroup}
            isReducedMotion={isReducedMotion}
            onNavigate={onNavigate}
            LinkComponent={LinkComponent}
          />
        </Fragment>
      ))}
    </nav>
  );
};

DrawerNavigationNav.displayName = 'DrawerNavigationNav';
