import { Text } from '@vassembly/ui-text';

import type { LegalDocumentShellProps } from './types';
import styles from './LegalDocumentShell.module.scss';

export const LegalDocumentShell = ({ title, sections }: LegalDocumentShellProps) => {
  return (
    <main className={styles.main}>
      <article className={styles.article}>
        <Text variant="h1" className={styles.documentTitle}>
          {title}
        </Text>
        {sections.map((section) => {
          const headingId = `${section.id}-heading`;

          return (
            <section
              key={section.id}
              className={styles.section}
              aria-labelledby={headingId}
            >
              <Text id={headingId} variant="h2" className={styles.sectionTitle} as="h2">
                {section.title}
              </Text>
              {section.paragraphs.map((paragraph, index) => (
                <Text
                  key={`${section.id}-${index.toString()}`}
                  variant="body1"
                  className={styles.paragraph}
                  as="p"
                >
                  {paragraph}
                </Text>
              ))}
            </section>
          );
        })}
      </article>
    </main>
  );
};
