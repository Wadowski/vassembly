'use client';

import { Suspense } from 'react';

import { Text } from '@vassembly/ui-text';
import { useUserAuth } from '@vassembly/ui-user-auth';

import {
  SETTINGS_DESKTOP_MIN_WIDTH_MEDIA,
  useMatchesMinWidth,
} from '../../lib/hooks/useMatchesMinWidth';
import { UserSettingsPreferenceProvider } from '../../lib/preferences';
import styles from './SettingsSections.module.scss';
import { SettingsAccountDeletionSection } from './_components/SettingsAccountDeletionSection';
import { SettingsContentContainer } from './_components/SettingsContentContainer';
import { SettingsDesktopNav } from './_components/SettingsDesktopNav';
import { SettingsNotificationsSection } from './_components/SettingsNotificationsSection';
import { SettingsPageHeader } from './_components/SettingsPageHeader';
import { SettingsPrivacySection } from './_components/SettingsPrivacySection';
import { SettingsProfileSection } from './_components/SettingsProfileSection';
import { SettingsSecuritySection } from './_components/SettingsSecuritySection';
import { SettingsSessionSection } from './_components/SettingsSessionSection';

export const SettingsAuthenticatedView = (): JSX.Element => {
  const { user } = useUserAuth();
  const authenticatedSubjectId = user?.id ?? '';
  const isDesktopNavEligible = useMatchesMinWidth(SETTINGS_DESKTOP_MIN_WIDTH_MEDIA);

  if (!authenticatedSubjectId) {
    return <></>;
  }

  const notificationsFallback = (
    <div className={styles.sectionCard} id="notifications">
      <Text variant="body2">Loading notification preferences.</Text>
    </div>
  );

  return (
    <UserSettingsPreferenceProvider userId={authenticatedSubjectId}>
      <div className={styles.settingsOuter}>
        <SettingsPageHeader />
        <div className={styles.settingsLayoutSplit}>
          {isDesktopNavEligible ? <SettingsDesktopNav /> : null}
          <SettingsContentContainer>
            <SettingsProfileSection subjectUserId={authenticatedSubjectId} />
            <SettingsSecuritySection />
            <Suspense fallback={notificationsFallback}>
              <SettingsNotificationsSection subjectUserId={authenticatedSubjectId} />
            </Suspense>
            <SettingsPrivacySection subjectUserId={authenticatedSubjectId} />
            <SettingsSessionSection />
            <SettingsAccountDeletionSection />
          </SettingsContentContainer>
        </div>
      </div>
    </UserSettingsPreferenceProvider>
  );
};
