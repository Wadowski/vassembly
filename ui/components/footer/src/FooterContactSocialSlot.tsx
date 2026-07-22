import { Text } from '@vassembly/ui-system-design/text';
import { FooterContactBlock } from './FooterContactBlock';
import styles from './Footer.module.scss';
import type { FooterContactSocialSlotProps } from './types';

export const FooterContactSocialSlot = (props: FooterContactSocialSlotProps): JSX.Element | null => {
  const { contact, social } = props;
  const showContact = !!(contact?.email || contact?.phone || contact?.address);
  const showSocial = social?.length;

  if (!showContact && !showSocial) return null;

  return (
    <div className={styles.slotContactSocial}>
      <div className={styles.contactSocialInner}>
        {showContact ? <FooterContactBlock contact={contact} /> : null}
        {showSocial ? (
          <nav aria-label="Social media">
            <ul className={styles.socialRow}>
              {social?.map((item, index) => (
                <li key={`${item.href}-${index}`} className={styles.socialItem}>
                  <a
                    href={item.href}
                    className={styles.socialLink}
                    aria-label={item.ariaLabel}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <span className={styles.socialIcon}>{item.icon}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </div>
    </div>
  );
};

FooterContactSocialSlot.displayName = 'FooterContactSocialSlot';
