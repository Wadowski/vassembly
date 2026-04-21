import styles from './Footer.module.scss';
import { FooterLinkColumn } from './FooterLinkColumn';
import type { FooterCompanyLegalSlotProps } from './types';

export const FooterCompanyLegalSlot = (props: FooterCompanyLegalSlotProps): JSX.Element | null => {
  const { company, legal } = props;
  const showCompany = company?.length;
  const showLegal = legal?.length;

  if (!showCompany && !showLegal) return null;

  return (
    <div className={styles.slotCompanyLegal}>
      <div className={styles.companyLegalInner}>
        {showCompany ? (
          <FooterLinkColumn ariaLabel="Company" title="Company" links={company ?? []} />
        ) : null}
        {showLegal ? (
          showCompany ? (
            <div className={styles.legalGap}>
              <FooterLinkColumn ariaLabel="Legal" title="Legal" links={legal ?? []} />
            </div>
          ) : (
            <FooterLinkColumn ariaLabel="Legal" title="Legal" links={legal ?? []} />
          )
        ) : null}
      </div>
    </div>
  );
};

FooterCompanyLegalSlot.displayName = 'FooterCompanyLegalSlot';
