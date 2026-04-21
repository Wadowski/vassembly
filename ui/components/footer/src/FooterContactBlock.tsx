import { Text } from '@vassembly/ui-text';
import { resolveClassName } from '@vassembly/ui-utils';
import styles from './Footer.module.scss';
import type { FooterContactBlockProps, FooterContactField } from './types';

const ContactFieldRow = (props: { field: FooterContactField }): JSX.Element => {
  const { field } = props;
  const body = field.href ? (
    <a href={field.href} className={styles.footerLink}>
      <Text variant="body2" as="span">
        {field.value}
      </Text>
    </a>
  ) : (
    <Text variant="body2" as="span" className={styles.contactValue}>
      {field.value}
    </Text>
  );

  return (
    <div className={styles.contactRow}>
      {body}
    </div>
  );
};

export const FooterContactBlock = (props: FooterContactBlockProps): JSX.Element => {
  const { contact, className } = props;

  return (
    <address className={className}>
      <Text variant="label" as="p" className={styles.columnTitle}>
        Contact
      </Text>
      <div className={styles.contactInner}>
        {contact.email ? <ContactFieldRow field={contact.email} /> : null}
        {contact.phone ? <ContactFieldRow field={contact.phone} /> : null}
        {contact.address ? (
          <div className={styles.contactRow}>
            <Text variant="body2" as="span" className={styles.contactValue}>
              {contact.address}
            </Text>
          </div>
        ) : null}
      </div>
    </address>
  );
};

FooterContactBlock.displayName = 'FooterContactBlock';
