'use client';

import { AnchorList } from '@vassembly/ui-anchor-list';
import type { AnchorListItem } from '@vassembly/ui-anchor-list';

import { SETTINGS_SECTION_DESCRIPTOR_LIST } from '../sectionAnchors';
import styles from '../SettingsSections.module.scss';
import { useAnchorLocationHash } from '../useAnchorLocationHash';

const ANCHOR_LIST_ITEMS: AnchorListItem[] = SETTINGS_SECTION_DESCRIPTOR_LIST.map((descriptor) => ({
  label: descriptor.label,
  href: `#${descriptor.anchorId}`,
}));

export const SettingsDesktopNav = (): JSX.Element => {
  const anchorHashFragment = useAnchorLocationHash();

  return (
    <div className={styles.desktopStickyNav}>
      <AnchorList
        items={ANCHOR_LIST_ITEMS}
        activeHref={anchorHashFragment === '' ? undefined : anchorHashFragment}
        ariaLabel="Settings sections"
      />
    </div>
  );
};
