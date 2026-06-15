import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import styles from './MarkdownContent.module.scss';

import type { MarkdownContentProps } from './types';

export const MarkdownContent = ({
  content,
  className,
  testId,
}: MarkdownContentProps): JSX.Element => {
  const containerClassName = className
    ? `${styles.markdownContent} ${className}`
    : styles.markdownContent;

  return (
    <div className={containerClassName} data-testid={testId}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
};
