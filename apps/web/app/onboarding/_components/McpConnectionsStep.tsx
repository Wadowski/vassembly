'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@vassembly/ui-system-design/button';
import { LockIcon } from '@vassembly/ui-system-design/icons';
import { Switch } from '@vassembly/ui-system-design/switch';
import { Text } from '@vassembly/ui-system-design/text';

import { OnboardingStepCard } from './OnboardingStepCard';
import type { OnboardingStepStatus } from './OnboardingStepCard';
import { useMcpConnectionsStep } from './useMcpConnectionsStep';
import styles from './McpConnectionsStep.module.scss';

export interface McpConnectionsStepProps {
  isLocked: boolean;
}

const resolveStatus = ({
  isLocked,
  isEnabled,
}: {
  isLocked: boolean;
  isEnabled: boolean;
}): OnboardingStepStatus => {
  if (isEnabled) {
    return 'done';
  }
  if (isLocked) {
    return 'locked';
  }
  return 'active';
};

export const McpConnectionsStep = ({ isLocked }: McpConnectionsStepProps): JSX.Element => {
  const router = useRouter();
  const { isEnabled, isLoading, errorMessage, handleToggle } = useMcpConnectionsStep({
    isLocked,
  });
  const status = resolveStatus({ isLocked, isEnabled });

  const handleManageConnectionsClick = (): void => {
    router.push('/mcps');
  };

  const body = isLocked ? (
    <div className={styles.lockMessage}>
      <LockIcon className={styles.lockIcon} aria-hidden />
      <Text variant="body2">Complete step 2 — add an AI integration first.</Text>
    </div>
  ) : (
    <div className={styles.bodyStack}>
      <Text variant="body1">
        {isEnabled
          ? 'Zero-setup MCPs are connected. You can fine-tune individual connections anytime.'
          : 'Some of our MCPs work instantly — no setup required. Flip the switch to turn them all on for your agents.'}
      </Text>
      <div className={styles.toggleRow}>
        <Switch
          isChecked={isEnabled}
          isDisabled={isLocked || isLoading}
          isLoading={isLoading}
          label="Enable zero-setup MCPs"
          onChange={handleToggle}
        />
        {errorMessage ? (
          <Text variant="body2" className={styles.errorText}>
            {errorMessage}
          </Text>
        ) : null}
      </div>
    </div>
  );

  const footer = (
    <>
      <Text variant="body2" className={styles.footerHint}>
        {isLocked
          ? 'Available after AI integration setup'
          : 'Optional — you can always manage this later from MCP settings.'}
      </Text>
      <div className={styles.footerActions}>
        <Button
          variant="outlined"
          text="Manage individual connections"
          isDisabled={isLocked}
          onClick={handleManageConnectionsClick}
        />
      </div>
    </>
  );

  return (
    <OnboardingStepCard
      stepNumber={3}
      title="Connect MCPs"
      description="Turn on ready-to-use tool connections for your agents."
      status={status}
      statusBadgeLabel={isEnabled ? 'Enabled' : undefined}
      isLocked={isLocked}
      body={body}
      footer={footer}
    />
  );
};
