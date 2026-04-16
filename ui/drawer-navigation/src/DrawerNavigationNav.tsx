import { Fragment, type ReactNode } from 'react';
import { NavSectionLabel } from './NavSectionLabel';
import { NavListItems } from './NavListItems';
import type { DrawerNavigateEvent, NavSection, RenderNavLinkArgs } from './types';

export interface DrawerNavigationNavProps {
  sections: ReadonlyArray<NavSection>;
  activeLinkId: string | null;
  mainNavAriaLabel: string;
  isGroupExpanded: (groupId: string) => boolean;
  onToggleGroup: (args: { groupId: string }) => void;
  isReducedMotion: boolean;
  onNavigate: (event: DrawerNavigateEvent) => void;
  renderLink?: (args: RenderNavLinkArgs) => ReactNode;
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
    renderLink,
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
            renderLink={renderLink}
          />
        </Fragment>
      ))}
    </nav>
  );
};

DrawerNavigationNav.displayName = 'DrawerNavigationNav';
