import { useEffect } from 'react';
import { warnIfNavDepthInvalid } from './assertNavDepth';
import { DrawerBrandingHeader } from './DrawerBrandingHeader';
import { DrawerNavigationFooterSlot } from './DrawerNavigationFooterSlot';
import { DrawerNavigationNav } from './DrawerNavigationNav';
import styles from './DrawerNavigation.module.scss';
import { DrawerOverlay } from './DrawerOverlay';
import { DrawerShell } from './DrawerShell';
import type { DrawerNavigationProps } from './types';
import { useDrawerActiveLink } from './useDrawerActiveLink';
import { useDrawerExpandedGroups } from './useDrawerExpandedGroups';
import { useReducedMotion } from './useReducedMotion';

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
    renderLink,
    footerVariant,
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
      footerVariant={footerVariant}
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
        renderLink={renderLink}
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
