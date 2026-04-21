import { useEffect } from 'react';
import { warnIfNavDepthInvalid } from './utils/assertNavDepth';
import { DrawerBrandingHeader } from './header/DrawerBrandingHeader';
import { DrawerNavigationFooterSlot } from './navigation/DrawerNavigationFooterSlot';
import { DrawerNavigationNav } from './navigation/DrawerNavigationNav';
import styles from './DrawerNavigation.module.scss';
import { DrawerOverlay } from './overlay/DrawerOverlay';
import { DrawerShell } from './shell/DrawerShell';
import type { DrawerNavigationProps } from './types';
import { useDrawerActiveLink } from './utils/useDrawerActiveLink';
import { useDrawerExpandedGroups } from './utils/useDrawerExpandedGroups';
import { useReducedMotion } from './utils/useReducedMotion';

export const DrawerNavigation = (props: DrawerNavigationProps): JSX.Element => {
  const {
    sections,
    currentPath,
    isActiveHref,
    isAuthenticated,
    user,
    onNavigate,
    branding,
    mainNavAriaLabel = 'Main',
    className,
    expandedGroupIds,
    onExpandedGroupIdsChange,
    defaultExpandedGroupIds,
    openerRef,
    LinkComponent,
  } = props;

  const isReducedMotion = useReducedMotion();
  const activeLinkId = useDrawerActiveLink({ sections, currentPath, isActiveHref });

  useEffect(() => {
    warnIfNavDepthInvalid(sections);
  }, [sections]);

  const expansion = useDrawerExpandedGroups({
    sections,
    expandedGroupIds,
    onExpandedGroupIdsChange,
    defaultExpandedGroupIds,
  });

  const header = branding ? <DrawerBrandingHeader branding={branding} /> : null;

  const footer = (
    <DrawerNavigationFooterSlot
      isAuthenticated={isAuthenticated}
      user={user}
      onOpenSettings={props.onOpenSettings}
      onLogout={props.onLogout}
      onLogin={props.onLogin}
      onRegister={props.onRegister}
    />
  );

  const body = (
    <div className={styles.column}>
      <DrawerNavigationNav
        sections={sections}
        activeLinkId={activeLinkId}
        mainNavAriaLabel={mainNavAriaLabel}
        isGroupExpanded={expansion.isGroupExpanded}
        onToggleGroup={expansion.toggleGroup}
        isReducedMotion={isReducedMotion}
        onNavigate={onNavigate}
        LinkComponent={LinkComponent}
      />
      <div className={styles.spacer} aria-hidden />
    </div>
  );

  const shell = (
    <DrawerShell header={header} footer={footer} className={className}>
      {body}
    </DrawerShell>
  );

  if (props.layout === 'overlay') {
    return (
      <DrawerOverlay
        isOpen={props.isOpen}
        onOpenChange={props.onOpenChange}
        openerRef={openerRef}
        isReducedMotion={isReducedMotion}
      >
        {shell}
      </DrawerOverlay>
    );
  }

  return shell;
};

DrawerNavigation.displayName = 'DrawerNavigation';
