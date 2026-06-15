import React from 'react';
import { formatTokens } from '../utils/formatTokens';
import type { TokenUsageWidgetProps } from '../types';
import styles from './TokenUsageWidget.module.scss';

export const TokenUsageWidget: React.FC<TokenUsageWidgetProps> = ({ tokenUsage, variant = 'inline' }) => {
  const containerClass = variant === 'expanded' ? styles.tokenUsageExpanded : styles.tokenUsageInline;

  return (
    <div className={containerClass} role="region" aria-label="Token usage">
      <div className={styles.tokenUsageItem}>
        <span className={styles.tokenLabel}>Input:</span>
        <span className={styles.tokenValue}>{formatTokens(tokenUsage.input)}</span>
      </div>
      <div className={styles.tokenUsageItem}>
        <span className={styles.tokenLabel}>Output:</span>
        <span className={styles.tokenValue}>{formatTokens(tokenUsage.output)}</span>
      </div>
      <div className={styles.tokenUsageItem}>
        <span className={styles.tokenLabel}>Total:</span>
        <span className={styles.tokenValue}>{formatTokens(tokenUsage.total)}</span>
      </div>
    </div>
  );
};
