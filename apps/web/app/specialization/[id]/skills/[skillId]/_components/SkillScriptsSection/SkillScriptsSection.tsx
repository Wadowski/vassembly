'use client';

import { Text } from '@vassembly/ui-system-design/text';

import { EMPTY_SCRIPTS_MESSAGE } from '../constants';
import { SkillCodeViewer } from './SkillCodeViewer/SkillCodeViewer';
import { SkillScriptList } from './SkillScriptList/SkillScriptList';
import styles from './SkillScriptsSection.module.scss';
import type { SkillScriptsSectionProps } from '../types';

export const SkillScriptsSection = ({
  scripts,
  activeScript,
  scriptContent,
  scriptLoading,
  scriptError,
  onSelectScript,
  onScriptRetry,
}: SkillScriptsSectionProps): JSX.Element => {
  const hasScripts = scripts.length > 0;

  return (
    <section className={styles.section} aria-label="Skill scripts">
      <Text variant="h2" as="h2">
        Scripts
      </Text>
      {hasScripts ? (
        <div className={styles.layout}>
          <SkillScriptList
            scripts={scripts}
            activeScript={activeScript}
            onSelectScript={onSelectScript}
          />
          <SkillCodeViewer
            script={activeScript}
            content={scriptContent}
            loading={scriptLoading}
            error={scriptError}
            onRetry={onScriptRetry}
          />
        </div>
      ) : (
        <Text variant="body2" className={styles.emptyMessage} data-testid="skill-scripts-empty">
          {EMPTY_SCRIPTS_MESSAGE}
        </Text>
      )}
    </section>
  );
};
