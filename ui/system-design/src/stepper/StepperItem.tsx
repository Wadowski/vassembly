import { Text } from '@vassembly/ui-system-design/text';
import { resolveClassName } from '@vassembly/ui-system-design/utils';
import styles from './Stepper.module.scss';
import type { StepperItemProps, StepState } from './types';

const STEP_ITEM_CLASS_MAP: Record<StepState, string> = {
  completed: styles.itemCompleted,
  current: styles.itemCurrent,
  upcoming: styles.itemUpcoming,
};

export const StepperItem = ({ step, state, isLast }: StepperItemProps): JSX.Element => {
  return (
    <li
      className={resolveClassName(styles.item, STEP_ITEM_CLASS_MAP[state])}
      aria-current={state === 'current' ? 'step' : undefined}
    >
      <div className={styles.row}>
        <div className={styles.rail}>
          <div className={styles.iconSlot} aria-hidden="true">
            {step.icon}
          </div>
          {isLast ? null : <div className={styles.connector} aria-hidden="true" />}
        </div>
        <div className={styles.content}>
          <Text variant="label" as="span" className={styles.title}>
            {step.title}
          </Text>
          <Text variant="body2" as="p" className={styles.description}>
            {step.description}
          </Text>
        </div>
      </div>
    </li>
  );
};
