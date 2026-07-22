import type { CSSProperties } from 'react';
import { Text } from '@vassembly/ui-system-design/text';
import { resolveClassName } from '@vassembly/ui-system-design/utils';
import { FooterCompanyLegalSlot } from './FooterCompanyLegalSlot';
import { FooterContactSocialSlot } from './FooterContactSocialSlot';
import styles from './Footer.module.scss';
import { FooterLinkColumn } from './FooterLinkColumn';
import { hasFooterContent, hasRenderableCopyright } from './hasFooterContent';
import type { FooterProps } from './types';

const hasBrandSlot = (brand: FooterProps['brand']): boolean => {
  return !!(brand?.logo || brand?.tagline);
};

export const Footer = (props: FooterProps): JSX.Element | null => {
  const { className, id, brand, sitemap, company, legal, contact, social, copyright } = props;

  if (!hasFooterContent(props)) return null;

  const showBrand = hasBrandSlot(brand);
  const showSitemap = sitemap?.length;
  const showCompanyLegal =
    company?.length || legal?.length;
  const showContact = !!(contact?.email || contact?.phone || contact?.address);
  const showSocial = social?.length;
  const showContactSocial = showContact || showSocial;

  const columnCount = Math.max(
    1,
    Number(showBrand) +
      Number(showSitemap) +
      Number(showCompanyLegal) +
      Number(showContactSocial),
  );

  const gridStyle = { '--footer-cols': columnCount } as CSSProperties;

  return (
    <footer id={id} className={resolveClassName(styles.root, className)}>
      <div className={styles.grid} style={gridStyle}>
        {showBrand ? (
          <div className={styles.slotBrand}>
            <div className={styles.brandBlock}>
              {brand?.logo ? brand.logo : null}
              {brand?.tagline ? (
                <Text variant="body2" as="p" className={styles.contactValue}>
                  {brand.tagline}
                </Text>
              ) : null}
            </div>
          </div>
        ) : null}

        {showSitemap ? (
          <div className={styles.slotSitemap}>
            <FooterLinkColumn ariaLabel="Site map" title="Site map" links={sitemap ?? []} />
          </div>
        ) : null}

        <FooterCompanyLegalSlot company={company} legal={legal} />
        <FooterContactSocialSlot contact={contact} social={social} />
        {hasRenderableCopyright(copyright) ? (
          <div className={styles.slotCopyright}>
            <Text variant="caption" as="p" className={styles.copyright}>
              {copyright}
            </Text>
          </div>
        ) : null}
      </div>
    </footer>
  );
};

Footer.displayName = 'Footer';
