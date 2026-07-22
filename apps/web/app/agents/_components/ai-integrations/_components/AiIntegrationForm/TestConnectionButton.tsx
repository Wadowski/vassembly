'use client';

import type { TestConnectionResult } from '@vassembly/ui-api-hooks';
import { Button } from '@vassembly/ui-system-design/button';

import styles from './styles.module.scss';

export interface TestConnectionButtonProps {
  isTesting?: boolean;
  testResult?: TestConnectionResult;
  onTest: () => void;
}

export function TestConnectionButton({
  isTesting = false,
  testResult,
  onTest,
}: TestConnectionButtonProps): JSX.Element {
  const resultLabel =
    testResult?.success === true
      ? 'Connection verified'
      : testResult?.success === false
        ? 'Test failed'
        : undefined;

  return (
    <div className={styles.testConnectionRow}>
      <Button
        variant="outlined"
        text="Test connection"
        onClick={onTest}
        isDisabled={isTesting}
        isLoading={isTesting}
      />
      {resultLabel !== undefined ? (
        <span className={testResult?.success ? styles.testSuccess : styles.testError}>{resultLabel}</span>
      ) : null}
    </div>
  );
}
