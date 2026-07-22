'use client';

import { Alert } from '@vassembly/ui-system-design/alert';
import { Switch } from '@vassembly/ui-system-design/switch';
import { Text } from '@vassembly/ui-system-design/text';

import { usePrivacyPreferences } from '../../../lib/preferences';
import {
  SHOULD_SHOW_PRIVACY_ANALYTICS,
  SHOULD_SHOW_PRIVACY_CRASH,
  SHOULD_SHOW_PRIVACY_MARKETING,
} from '../featureVisibility';
import styles from '../SettingsSections.module.scss';

interface SettingsPrivacySectionProps {
  subjectUserId: string;
}

export const SettingsPrivacySection = ({
  subjectUserId,
}: SettingsPrivacySectionProps): JSX.Element | null => {
  const { analyticsEnabled, crashReportingEnabled, marketingOptIn, update, isLoading, error } =
    usePrivacyPreferences(subjectUserId);

  const hasAnyToggle =
    SHOULD_SHOW_PRIVACY_ANALYTICS || SHOULD_SHOW_PRIVACY_CRASH || SHOULD_SHOW_PRIVACY_MARKETING;

  if (!hasAnyToggle) {
    return null;
  }

  return (
    <section id="privacy" className={styles.sectionCard}>
      <Text variant="h2">Privacy</Text>
      {error ? <Alert variant="warning" message={error} /> : null}
      <div className={styles.preferenceStack}>
        {SHOULD_SHOW_PRIVACY_ANALYTICS ? (
          <Switch
            label="Product analytics"
            helperText="Helps us understand feature usage in aggregate."
            isChecked={analyticsEnabled}
            isDisabled={isLoading}
            onChange={(nextState) => {
              update.setAnalyticsEnabled(nextState);
            }}
          />
        ) : null}
        {SHOULD_SHOW_PRIVACY_CRASH ? (
          <Switch
            label="Crash reporting"
            helperText="Send anonymized diagnostics when something fails."
            isChecked={crashReportingEnabled}
            isDisabled={isLoading}
            onChange={(nextState) => {
              update.setCrashReportingEnabled(nextState);
            }}
          />
        ) : null}
        {SHOULD_SHOW_PRIVACY_MARKETING ? (
          <Switch
            label="Product updates email"
            helperText="Occasional news about roadmap and releases."
            isChecked={marketingOptIn}
            isDisabled={isLoading}
            onChange={(nextState) => {
              update.setMarketingOptIn(nextState);
            }}
          />
        ) : null}
      </div>
    </section>
  );
};
