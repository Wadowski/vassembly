'use client';

import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { Alert } from '@vassembly/ui-system-design/alert';
import { Button } from '@vassembly/ui-system-design/button';
import { Skeleton } from '@vassembly/ui-system-design/skeleton';

import { LANGUAGE_MAP } from '../../constants';
import styles from './SkillCodeViewer.module.scss';
import type { SkillCodeViewerProps } from '../../types';

SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('bash', bash);

export const SkillCodeViewer = ({
  script,
  content,
  loading,
  error,
  onRetry,
}: SkillCodeViewerProps): JSX.Element | null => {
  if (script === null) {
    return null;
  }

  const highlightLanguage = LANGUAGE_MAP[script.language];

  if (loading) {
    return (
      <div className={styles.viewer} data-testid="skill-code-viewer">
        <Skeleton width="100%" height="320px" />
      </div>
    );
  }

  if (error !== null) {
    return (
      <div className={styles.viewer} data-testid="skill-code-viewer">
        <div className={styles.errorBlock}>
          <Alert variant="error" message={error} />
          <Button variant="outlined" text="Try again" onClick={onRetry} />
        </div>
      </div>
    );
  }

  if (content === null) {
    return null;
  }

  return (
    <div
      className={styles.viewer}
      data-testid="skill-code-viewer"
      data-language={highlightLanguage}
    >
      <SyntaxHighlighter
        language={highlightLanguage}
        style={vscDarkPlus}
        customStyle={{ margin: 0, borderRadius: '8px' }}
      >
        {content}
      </SyntaxHighlighter>
    </div>
  );
};
