'use client';

import { Text } from '@vassembly/ui-system-design/text';

import styles from './SkillScriptList.module.scss';
import type { SkillScriptListProps } from '../../types';

export const SkillScriptList = ({
  scripts,
  activeScript,
  onSelectScript,
}: SkillScriptListProps): JSX.Element => {
  return (
    <ul className={styles.list} aria-label="Skill scripts">
      {scripts.map((script) => {
        const isActive = activeScript?.filename === script.filename;

        return (
          <li key={script.filename}>
            <button
              type="button"
              className={isActive ? styles.itemActive : styles.item}
              onClick={() => {
                onSelectScript(script);
              }}
              aria-current={isActive ? 'true' : undefined}
            >
              <Text variant="body2" className={styles.filename}>
                {script.filename}
              </Text>
            </button>
          </li>
        );
      })}
    </ul>
  );
};
