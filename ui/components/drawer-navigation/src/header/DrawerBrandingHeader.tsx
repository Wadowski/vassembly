import type { DrawerBranding } from '../types';
import styles from './DrawerBrandingHeader.module.scss';

export interface DrawerBrandingHeaderProps {
  branding: DrawerBranding;
}

export const DrawerBrandingHeader = (props: DrawerBrandingHeaderProps): JSX.Element | null => {
  const { branding } = props;

  return (
    <div className={styles.root}>
      <div className={styles.row}>
        {branding.logo}
        <h2 className={styles.product}>{branding.productName}</h2>
      </div>
      {branding.tagline ? <p className={styles.tagline}>{branding.tagline}</p> : null}
    </div>
  );
};

DrawerBrandingHeader.displayName = 'DrawerBrandingHeader';
