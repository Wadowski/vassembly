import { Text } from '@vassembly/ui-system-design/text';
import { resolveClassName } from '@vassembly/ui-system-design/utils';
import { PASSWORD_REQUIREMENT_LABELS, PASSWORD_STRENGTH_LABELS } from './constants';
import type { PasswordStrengthResult } from './types';
import styles from './PasswordStrengthIndicator.module.scss';

type RequirementKey = keyof typeof PASSWORD_REQUIREMENT_LABELS;

export interface PasswordStrengthIndicatorProps {
  strength: PasswordStrengthResult;
  className?: string;
}

export const PasswordStrengthIndicator = (props: PasswordStrengthIndicatorProps) => {
  const { strength, className } = props;
  const resolvedClassName = resolveClassName(styles.root, className);
  const checks: { key: RequirementKey; ok: boolean }[] = [
    { key: 'hasMinLength', ok: strength.hasMinLength },
    { key: 'hasUppercase', ok: strength.hasUppercase },
    { key: 'hasLowercase', ok: strength.hasLowercase },
    { key: 'hasNumber', ok: strength.hasNumber },
    { key: 'hasSpecialChar', ok: strength.hasSpecialChar },
  ];

  return (
    <div
      className={resolvedClassName}
      role="status"
      aria-label="Password strength"
      aria-live="polite"
    >
      <Text variant="body2" className={styles.levelLabel}>
        {PASSWORD_STRENGTH_LABELS[strength.level]}
      </Text>
      <ul className={styles.list}>
        {checks.map(({ key, ok }) => (
          <li key={key} className={styles.item}>
            <Text variant="caption" className={ok ? styles.met : styles.unmet}>
              {ok ? '✓' : '✗'} {PASSWORD_REQUIREMENT_LABELS[key]}
            </Text>
          </li>
        ))}
      </ul>
    </div>
  );
};
